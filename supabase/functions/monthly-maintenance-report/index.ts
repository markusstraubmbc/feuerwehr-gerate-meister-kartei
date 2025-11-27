import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceItem {
  equipment_name: string;
  template_name: string;
  due_date: string;
  status: string;
  equipment_id: string;
  category_name: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Log cron job start
  const { data: logData } = await supabase
    .from("cron_job_logs")
    .insert({
      job_name: "monthly-maintenance-report",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const logId = logData?.id;

  try {
    console.log("Starting monthly maintenance report generation...");

    // Get sender configuration
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
    const senderName = senderNameData?.value as string || "Wartungsberichte";

    // Get maintenance report recipients
    const { data: maintenanceRecipientsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "maintenance_report_recipients")
      .maybeSingle();

    // Get weekly report recipients (Wochenberichts-Empfänger)
    const { data: weeklyRecipientsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "email_recipients")
      .maybeSingle();

    const maintenanceRecipients = (maintenanceRecipientsData?.value as string[]) || [];
    const weeklyRecipients = (weeklyRecipientsData?.value as string[]) || [];
    
    // Kombiniere beide Listen und entferne Duplikate
    const additionalRecipients = [...new Set([...maintenanceRecipients, ...weeklyRecipients])];

    // Fetch all maintenance records that are due or overdue
    const { data: maintenanceRecords, error: maintenanceError } = await supabase
      .from("maintenance_records")
      .select(`
        id,
        due_date,
        status,
        equipment:equipment_id (
          id,
          name,
          category:category_id (
            name
          )
        ),
        template:template_id (
          name,
          responsible_person:responsible_person_id (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .in("status", ["ausstehend", "geplant"])
      .lte("due_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (maintenanceError) {
      throw new Error(`Error fetching maintenance records: ${maintenanceError.message}`);
    }

    console.log(`Found ${maintenanceRecords?.length || 0} maintenance records`);

    if (!maintenanceRecords || maintenanceRecords.length === 0) {
      const duration = (Date.now() - startTime) / 1000;
      await supabase
        .from("cron_job_logs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          details: { message: "Keine fälligen Wartungen gefunden" },
        })
        .eq("id", logId);

      return new Response(
        JSON.stringify({ success: true, message: "Keine fälligen Wartungen" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group maintenance by responsible person
    const maintenanceByPerson = new Map<string, {
      person: any;
      items: MaintenanceItem[];
    }>();

    for (const record of maintenanceRecords) {
      const equipment = record.equipment as any;
      const template = record.template as any;
      const responsiblePerson = template?.responsible_person;

      if (!responsiblePerson?.email) continue;

      const personKey = responsiblePerson.email;
      
      if (!maintenanceByPerson.has(personKey)) {
        maintenanceByPerson.set(personKey, {
          person: responsiblePerson,
          items: [],
        });
      }

      maintenanceByPerson.get(personKey)!.items.push({
        equipment_name: equipment?.name || "Unbekannt",
        template_name: template?.name || "Keine Vorlage",
        due_date: record.due_date,
        status: record.status,
        equipment_id: equipment?.id,
        category_name: equipment?.category?.name || null,
      });
    }

    console.log(`Grouped maintenance for ${maintenanceByPerson.size} persons`);

    // Send emails to each responsible person
    const emailResults = [];
    
    for (const [email, data] of maintenanceByPerson.entries()) {
      const { person, items } = data;
      
      // Sort items by due date
      items.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      // Build HTML email content
      const overdueItems = items.filter(item => new Date(item.due_date) < new Date());
      const upcomingItems = items.filter(item => new Date(item.due_date) >= new Date());

      let emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Monatlicher Wartungsbericht</h2>
          <p>Hallo ${person.first_name} ${person.last_name},</p>
          <p>hier ist Ihr monatlicher Wartungsbericht mit allen fälligen und überfälligen Wartungen:</p>
      `;

      if (overdueItems.length > 0) {
        emailHtml += `
          <h3 style="color: #dc2626; margin-top: 20px;">Überfällige Wartungen (${overdueItems.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #fee; border-bottom: 2px solid #ddd;">
                <th style="padding: 8px; text-align: left;">Ausrüstung</th>
                <th style="padding: 8px; text-align: left;">Wartungsvorlage</th>
                <th style="padding: 8px; text-align: left;">Fällig seit</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const item of overdueItems) {
          emailHtml += `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${item.equipment_name}</td>
              <td style="padding: 8px;">${item.template_name}</td>
              <td style="padding: 8px; color: #dc2626;">${new Date(item.due_date).toLocaleDateString('de-DE')}</td>
            </tr>
          `;
        }

        emailHtml += `
            </tbody>
          </table>
        `;
      }

      if (upcomingItems.length > 0) {
        emailHtml += `
          <h3 style="color: #f59e0b; margin-top: 20px;">Anstehende Wartungen (${upcomingItems.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #fef3c7; border-bottom: 2px solid #ddd;">
                <th style="padding: 8px; text-align: left;">Ausrüstung</th>
                <th style="padding: 8px; text-align: left;">Wartungsvorlage</th>
                <th style="padding: 8px; text-align: left;">Fällig am</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const item of upcomingItems) {
          emailHtml += `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${item.equipment_name}</td>
              <td style="padding: 8px;">${item.template_name}</td>
              <td style="padding: 8px;">${new Date(item.due_date).toLocaleDateString('de-DE')}</td>
            </tr>
          `;
        }

        emailHtml += `
            </tbody>
          </table>
        `;
      }

      emailHtml += `
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Dieser Bericht wurde automatisch generiert.<br>
            Gesamt: ${items.length} Wartungen (${overdueItems.length} überfällig, ${upcomingItems.length} anstehend)
          </p>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: [email],
          cc: additionalRecipients.length > 0 ? additionalRecipients : undefined,
          subject: `Monatlicher Wartungsbericht - ${overdueItems.length} überfällig, ${upcomingItems.length} anstehend`,
          html: emailHtml,
        });

        emailResults.push({
          email,
          name: `${person.first_name} ${person.last_name}`,
          status: "success",
          items_count: items.length,
        });

        console.log(`Email sent to ${email}`);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${email}:`, emailError);
        emailResults.push({
          email,
          name: `${person.first_name} ${person.last_name}`,
          status: "error",
          error: emailError.message,
        });
      }
    }

    // Update cron job log with success
    const duration = (Date.now() - startTime) / 1000;
    await supabase
      .from("cron_job_logs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        details: {
          message: `Wartungsberichte an ${emailResults.length} Empfänger versendet`,
          total_maintenance_items: maintenanceRecords.length,
          emails_sent: emailResults,
        },
      })
      .eq("id", logId);

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailResults.length,
        details: emailResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in monthly-maintenance-report:", error);

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
