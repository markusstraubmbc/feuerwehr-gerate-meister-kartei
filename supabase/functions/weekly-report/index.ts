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

    // Get central weekly report recipients from settings (stored as JSON array)
    const { data: recipientsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "email_recipients")
      .maybeSingle();

    const centralRecipients = Array.isArray(recipientsData?.value) ? recipientsData.value : [];

    // Get date ranges - 4 weeks ahead instead of 7 days
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const nextFourWeeks = new Date(now);
    nextFourWeeks.setDate(nextFourWeeks.getDate() + 28); // 4 weeks

    // Get overdue maintenance with template details including responsible person
    const { data: overdueMaintenance } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (name, barcode, location:location_id (name)),
        template:template_id (
          name,
          id,
          responsible_person:responsible_person_id (id, email, first_name, last_name)
        ),
        performer:performed_by (first_name, last_name)
      `)
      .eq("status", "ausstehend")
      .lt("due_date", now.toISOString());

    // Get upcoming maintenance (next 4 weeks) with template details
    const { data: upcomingMaintenance } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (name, barcode, location:location_id (name)),
        template:template_id (
          name,
          id,
          responsible_person:responsible_person_id (id, email, first_name, last_name)
        ),
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

    // Group maintenance by responsible person
    const maintenanceByPerson = new Map<string, {
      email: string;
      name: string;
      overdue: any[];
      upcoming: any[];
    }>();

    // Process overdue maintenance
    overdueMaintenance?.forEach(m => {
      const person = m.template?.responsible_person;
      if (person?.email) {
        const key = person.email;
        if (!maintenanceByPerson.has(key)) {
          maintenanceByPerson.set(key, {
            email: person.email,
            name: `${person.first_name} ${person.last_name}`,
            overdue: [],
            upcoming: []
          });
        }
        maintenanceByPerson.get(key)!.overdue.push(m);
      }
    });

    // Process upcoming maintenance
    upcomingMaintenance?.forEach(m => {
      const person = m.template?.responsible_person;
      if (person?.email) {
        const key = person.email;
        if (!maintenanceByPerson.has(key)) {
          maintenanceByPerson.set(key, {
            email: person.email,
            name: `${person.first_name} ${person.last_name}`,
            overdue: [],
            upcoming: []
          });
        }
        maintenanceByPerson.get(key)!.upcoming.push(m);
      }
    });

    // Function to create HTML report
    const createHtmlReport = (overdue: any[], upcoming: any[], completed: any[], issues: any[], personName?: string) => `
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
        <h1>📊 Wöchentlicher Wartungsbericht${personName ? ` - ${personName}` : ''}</h1>
        <p>Zeitraum: ${lastWeek.toLocaleDateString('de-DE')} - ${now.toLocaleDateString('de-DE')}</p>
        
        <div class="summary">
          <h3>Zusammenfassung</h3>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number critical">${overdue?.length || 0}</div>
              <div class="stat-label">Überfällige Wartungen</div>
            </div>
            <div class="stat-card">
              <div class="stat-number warning">${upcoming?.length || 0}</div>
              <div class="stat-label">Anstehend (4 Wochen)</div>
            </div>
            ${!personName ? `
            <div class="stat-card">
              <div class="stat-number success">${completed?.length || 0}</div>
              <div class="stat-label">Abgeschlossen (7 Tage)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number critical">${issues?.length || 0}</div>
              <div class="stat-label">Ausrüstung mit Problemen</div>
            </div>
            ` : ''}
          </div>
        </div>

        ${(overdue?.length || 0) > 0 ? `
          <h2 class="critical">⚠️ Überfällige Wartungen (${overdue.length})</h2>
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
              ${overdue.map(m => `
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

        ${(upcoming?.length || 0) > 0 ? `
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
              ${upcoming.map(m => `
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

        ${!personName && (completed?.length || 0) > 0 ? `
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
              ${completed.slice(0, 10).map(m => `
                <tr>
                  <td>${m.equipment.name}</td>
                  <td>${m.equipment.location?.name || 'Nicht zugewiesen'}</td>
                  <td>${m.template?.name || 'Allgemeine Wartung'}</td>
                  <td>${new Date(m.performed_date).toLocaleDateString('de-DE')}</td>
                  <td>${m.performer ? `${m.performer.first_name} ${m.performer.last_name}` : 'Nicht bekannt'}</td>
                </tr>
              `).join('')}
              ${completed.length > 10 ? `<tr><td colspan="5" style="text-align: center; font-style: italic;">... und ${completed.length - 10} weitere</td></tr>` : ''}
            </tbody>
          </table>
        ` : ''}

        ${!personName && (issues?.length || 0) > 0 ? `
          <h2 class="critical">🔧 Ausrüstung mit Problemen (${issues.length})</h2>
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
              ${issues.map(eq => `
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

    // Send individualized emails to responsible persons
    const individualEmailPromises: Promise<any>[] = [];
    let individualEmailCount = 0;

    for (const [email, data] of maintenanceByPerson.entries()) {
      // Only send if there are overdue or upcoming items
      if (data.overdue.length > 0 || data.upcoming.length > 0) {
        const personalizedHtml = createHtmlReport(data.overdue, data.upcoming, [], [], data.name);
        
        individualEmailPromises.push(
          resend.emails.send({
            from: fromField,
            to: [email],
            subject: `📊 Ihr Wöchentlicher Wartungsbericht - ${now.toLocaleDateString('de-DE')}`,
            html: personalizedHtml,
          })
        );
        individualEmailCount++;
      }
    }

    // Send comprehensive email to central recipients
    const centralHtml = createHtmlReport(
      overdueMaintenance || [],
      upcomingMaintenance || [],
      completedMaintenance || [],
      equipmentIssues || []
    );

    const centralEmailPromises = centralRecipients.map((email: string) =>
      resend.emails.send({
        from: fromField,
        to: [email],
        subject: `📊 Wöchentlicher Wartungsbericht (Gesamt) - ${now.toLocaleDateString('de-DE')}`,
        html: centralHtml,
      })
    );

    // Send all emails
    const allEmailPromises = [...individualEmailPromises, ...centralEmailPromises];
    const results = await Promise.allSettled(allEmailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    console.log(`Weekly report sent to ${successCount} recipients (${individualEmailCount} personalized, ${centralRecipients.length} central)`);

    // Update cron job log with success
    const duration = (Date.now() - startTime) / 1000;
    await supabase
      .from("cron_job_logs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        details: {
          message: `Wochenbericht an ${successCount} Empfänger versendet (${individualEmailCount} personalisiert, ${centralRecipients.length} zentral)`,
          individualRecipients: individualEmailCount,
          centralRecipients: centralRecipients,
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
        message: `Weekly report sent to ${successCount} recipients (${individualEmailCount} personalized, ${centralRecipients.length} central)`,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
