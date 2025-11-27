import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting weekly report generation...");
    
    // Log cron job start
    const { data: logData } = await supabase
      .from("cron_job_logs")
      .insert({
        job_name: "weekly-report",
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const logId = logData?.id;

    // Get email settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["emailNotificationsEnabled", "emailFromAddress", "emailSenderDomain", "emailRecipients"]);

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    // Check if email notifications are enabled
    if (!settingsMap.emailNotificationsEnabled) {
      return new Response(
        JSON.stringify({ message: "Email notifications are disabled" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get sender configuration from settings
    const { data: senderEmailData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "sender_email")
      .maybeSingle();

    const { data: senderNameData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "sender_name")
      .maybeSingle();

    const senderEmail = senderEmailData?.value as string || "onboarding@resend.dev";
    const senderName = senderNameData?.value as string || "Wartungssystem";
    const fromField = `${senderName} <${senderEmail}>`;
    
    console.log(`Using sender: ${fromField}`);

    // Get weekly report recipients from settings (stored as JSON array)
    const { data: recipientsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "email_recipients")
      .maybeSingle();

    const weeklyRecipients = Array.isArray(recipientsData?.value) ? recipientsData.value : [];
    
    // Fetch all maintenance template responsible persons
    const { data: templatesData } = await supabase
      .from("maintenance_templates")
      .select(`
        responsible_person:responsible_person_id (
          email
        )
      `);
    
    const templateResponsibleEmails = templatesData
      ?.map((t: any) => t.responsible_person?.email)
      .filter((email: string | undefined) => email) || [];
    
    // Combine both recipient lists and remove duplicates
    const allRecipients = [...new Set([...weeklyRecipients, ...templateResponsibleEmails])];

    if (allRecipients.length === 0) {
      console.log("No recipients configured");
      
      const duration = (Date.now() - startTime) / 1000;
      await supabase
        .from("cron_job_logs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          details: { message: "Keine Empfänger konfiguriert" },
        })
        .eq("id", logId);
      
      return new Response(
        JSON.stringify({ message: "No recipients configured" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get date ranges - 4 weeks ahead instead of 7 days
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const nextFourWeeks = new Date(now);
    nextFourWeeks.setDate(nextFourWeeks.getDate() + 28); // 4 weeks

    // Get overdue maintenance
    const { data: overdueMaintenance } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (name, barcode, location:location_id (name)),
        template:template_id (name),
        performer:performed_by (first_name, last_name)
      `)
      .eq("status", "ausstehend")
      .lt("due_date", now.toISOString());

    // Get upcoming maintenance (next 4 weeks)
    const { data: upcomingMaintenance } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (name, barcode, location:location_id (name)),
        template:template_id (name),
        performer:performed_by (first_name, last_name)
      `)
      .in("status", ["ausstehend", "geplant"])
      .gte("due_date", now.toISOString())
      .lte("due_date", nextFourWeeks.toISOString());

    // Get completed maintenance (last 7 days)
    const { data: completedMaintenance } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (name, barcode, location:location_id (name)),
        template:template_id (name),
        performer:performed_by (first_name, last_name)
      `)
      .eq("status", "abgeschlossen")
      .gte("performed_date", lastWeek.toISOString());

    // Get equipment with issues
    const { data: equipmentIssues } = await supabase
      .from("equipment")
      .select(`
        *,
        location:location_id (name),
        category:category_id (name)
      `)
      .in("status", ["defekt", "wartung", "prüfung fällig"]);

    // Create HTML report
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .critical { color: #dc2626; font-weight: bold; }
          .warning { color: #ea580c; }
          .success { color: #16a34a; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { background: #f9fafb; padding: 15px; border-radius: 5px; flex: 1; }
          .stat-number { font-size: 2em; font-weight: bold; color: #2563eb; }
          .stat-label { color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>📊 Wöchentlicher Wartungsbericht</h1>
        <p>Zeitraum: ${lastWeek.toLocaleDateString('de-DE')} - ${now.toLocaleDateString('de-DE')}</p>
        
        <div class="summary">
          <h3>Zusammenfassung</h3>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number critical">${overdueMaintenance?.length || 0}</div>
              <div class="stat-label">Überfällige Wartungen</div>
            </div>
            <div class="stat-card">
              <div class="stat-number warning">${upcomingMaintenance?.length || 0}</div>
              <div class="stat-label">Anstehend (4 Wochen)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number success">${completedMaintenance?.length || 0}</div>
              <div class="stat-label">Abgeschlossen (7 Tage)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number critical">${equipmentIssues?.length || 0}</div>
              <div class="stat-label">Ausrüstung mit Problemen</div>
            </div>
          </div>
        </div>

        ${(overdueMaintenance?.length || 0) > 0 ? `
          <h2 class="critical">⚠️ Überfällige Wartungen (${overdueMaintenance.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Ausrüstung</th>
                <th>Standort</th>
                <th>Wartungstyp</th>
                <th>Fällig seit</th>
                <th>Verantwortlich</th>
              </tr>
            </thead>
            <tbody>
              ${overdueMaintenance.map(m => `
                <tr>
                  <td>${m.equipment.name}</td>
                  <td>${m.equipment.location?.name || 'Nicht zugewiesen'}</td>
                  <td>${m.template?.name || 'Allgemeine Wartung'}</td>
                  <td class="critical">${new Date(m.due_date).toLocaleDateString('de-DE')}</td>
                  <td>${m.performer ? `${m.performer.first_name} ${m.performer.last_name}` : 'Nicht zugewiesen'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${(upcomingMaintenance?.length || 0) > 0 ? `
          <h2 class="warning">📅 Anstehende Wartungen (Nächste 4 Wochen)</h2>
          <table>
            <thead>
              <tr>
                <th>Ausrüstung</th>
                <th>Standort</th>
                <th>Wartungstyp</th>
                <th>Fällig am</th>
                <th>Verantwortlich</th>
              </tr>
            </thead>
            <tbody>
              ${upcomingMaintenance.map(m => `
                <tr>
                  <td>${m.equipment.name}</td>
                  <td>${m.equipment.location?.name || 'Nicht zugewiesen'}</td>
                  <td>${m.template?.name || 'Allgemeine Wartung'}</td>
                  <td>${new Date(m.due_date).toLocaleDateString('de-DE')}</td>
                  <td>${m.performer ? `${m.performer.first_name} ${m.performer.last_name}` : 'Nicht zugewiesen'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${(completedMaintenance?.length || 0) > 0 ? `
          <h2 class="success">✅ Abgeschlossene Wartungen (Letzte 7 Tage)</h2>
          <table>
            <thead>
              <tr>
                <th>Ausrüstung</th>
                <th>Standort</th>
                <th>Wartungstyp</th>
                <th>Abgeschlossen am</th>
                <th>Durchgeführt von</th>
              </tr>
            </thead>
            <tbody>
              ${completedMaintenance.slice(0, 10).map(m => `
                <tr>
                  <td>${m.equipment.name}</td>
                  <td>${m.equipment.location?.name || 'Nicht zugewiesen'}</td>
                  <td>${m.template?.name || 'Allgemeine Wartung'}</td>
                  <td>${new Date(m.performed_date).toLocaleDateString('de-DE')}</td>
                  <td>${m.performer ? `${m.performer.first_name} ${m.performer.last_name}` : 'Nicht bekannt'}</td>
                </tr>
              `).join('')}
              ${completedMaintenance.length > 10 ? `<tr><td colspan="5" style="text-align: center; font-style: italic;">... und ${completedMaintenance.length - 10} weitere</td></tr>` : ''}
            </tbody>
          </table>
        ` : ''}

        ${(equipmentIssues?.length || 0) > 0 ? `
          <h2 class="critical">🔧 Ausrüstung mit Problemen (${equipmentIssues.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Ausrüstung</th>
                <th>Standort</th>
                <th>Kategorie</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentIssues.map(eq => `
                <tr>
                  <td>${eq.name}</td>
                  <td>${eq.location?.name || 'Nicht zugewiesen'}</td>
                  <td>${eq.category?.name || 'Nicht kategorisiert'}</td>
                  <td class="critical">${eq.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #6b7280; font-size: 0.9em;">
          <p>Dieser Bericht wurde automatisch generiert.</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Wartungsmanagement-Team</p>
        </div>
      </body>
      </html>
    `;

    // Send emails
    const emailPromises = allRecipients.map((email: string) =>
      resend.emails.send({
        from: fromField,
        to: [email],
        subject: `📊 Wöchentlicher Wartungsbericht - ${now.toLocaleDateString('de-DE')}`,
        html: html,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    console.log(`Weekly report sent to ${successCount}/${allRecipients.length} recipients`);

    // Update cron job log with success
    const duration = (Date.now() - startTime) / 1000;
    await supabase
      .from("cron_job_logs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        details: {
          message: `Wochenbericht an ${successCount} Empfänger versendet`,
          recipients: allRecipients,
          stats: {
            overdue: overdueMaintenance?.length || 0,
            upcoming: upcomingMaintenance?.length || 0,
            completed: completedMaintenance?.length || 0,
            equipmentIssues: equipmentIssues?.length || 0
          }
        },
      })
      .eq("id", logId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weekly report sent to ${successCount}/${allRecipients.length} recipients`,
        stats: {
          overdue: overdueMaintenance?.length || 0,
          upcoming: upcomingMaintenance?.length || 0,
          completed: completedMaintenance?.length || 0,
          equipmentIssues: equipmentIssues?.length || 0
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in weekly-report function:", error);
    
    // Update cron job log with error
    const duration = (Date.now() - startTime) / 1000;
    await supabase
      .from("cron_job_logs")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        error_message: error.message,
      })
      .eq("id", logId);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
