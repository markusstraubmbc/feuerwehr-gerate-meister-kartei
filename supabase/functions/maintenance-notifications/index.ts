
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { supabase } from "../_shared/supabaseClient.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if we should send upcoming maintenance notifications or a monthly report
    const { type } = await req.json();

    if (type === "upcoming") {
      return await sendUpcomingMaintenanceNotifications();
    } else if (type === "monthly-report") {
      return await sendMonthlyReport();
    } else {
      throw new Error("Invalid notification type");
    }
  } catch (error) {
    console.error("Error in maintenance-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

async function sendUpcomingMaintenanceNotifications() {
  try {
    // Get settings to determine days interval
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "email_settings")
      .maybeSingle();
    
    // Default to 7 days if no settings found
    const daysInterval = settingsData?.value?.upcoming_days_interval || 7;
    
    // Get maintenance records due in X days with their related data
    const today = new Date();
    const inXDays = new Date();
    inXDays.setDate(today.getDate() + daysInterval);
    
    const { data: upcomingMaintenances, error } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (*),
        template:template_id (
          *,
          responsible_person:responsible_person_id (*)
        )
      `)
      .eq("status", "ausstehend")
      .lte("due_date", inXDays.toISOString())
      .gte("due_date", today.toISOString());
      
    if (error) throw error;
    
    console.log(`Found ${upcomingMaintenances.length} upcoming maintenance tasks`);
    
    // Group notifications by responsible person
    const notificationsByPerson = {};
    
    for (const maintenance of upcomingMaintenances) {
      if (!maintenance.template?.responsible_person?.email) {
        console.log(`Skipping notification for maintenance ID ${maintenance.id} - no responsible person email`);
        continue;
      }
      
      const personEmail = maintenance.template.responsible_person.email;
      const personName = `${maintenance.template.responsible_person.first_name} ${maintenance.template.responsible_person.last_name}`;
      
      if (!notificationsByPerson[personEmail]) {
        notificationsByPerson[personEmail] = {
          name: personName,
          maintenances: []
        };
      }
      
      notificationsByPerson[personEmail].maintenances.push(maintenance);
    }
    
    // Send emails to each responsible person
    const sentEmails = [];
    
    for (const [email, data] of Object.entries(notificationsByPerson)) {
      const { name, maintenances } = data as { name: string, maintenances: any[] };
      
      const maintenancesList = maintenances.map(m => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.equipment.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.equipment.inventory_number || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.template.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(m.due_date).toLocaleDateString('de-DE')}</td>
        </tr>
      `).join('');
      
      const emailResult = await resend.emails.send({
        from: "Wartungsbenachrichtigung <onboarding@resend.dev>",
        to: [email],
        subject: `Wartungsaufgaben in den nächsten ${daysInterval} Tagen`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
              <h1 style="color: #2563eb;">Anstehende Wartungsaufgaben</h1>
              <p>Hallo ${name},</p>
              <p>folgende Wartungsaufgaben stehen in den nächsten ${daysInterval} Tagen an:</p>
              
              <table style="border-collapse: collapse; width: 100%;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Ausrüstung</th>
                    <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Inventarnummer</th>
                    <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Wartungstyp</th>
                    <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Fällig am</th>
                  </tr>
                </thead>
                <tbody>
                  ${maintenancesList}
                </tbody>
              </table>
              
              <p>Bitte planen Sie diese Wartungsarbeiten entsprechend ein.</p>
              <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
            </body>
          </html>
        `,
      });
      
      sentEmails.push({
        email,
        maintenanceCount: maintenances.length,
        status: emailResult.error ? 'error' : 'sent'
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentEmails.length} email notifications`,
        details: sentEmails
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error sending upcoming maintenance notifications:", error);
    throw error;
  }
}

async function sendMonthlyReport() {
  try {
    // Find all equipment and sort by next maintenance date
    const { data: equipment, error } = await supabase
      .from("equipment")
      .select(`
        *,
        location:location_id (name)
      `)
      .order("next_check_date");
    
    if (error) throw error;
    
    // Get all persons with email addresses
    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("*")
      .not("email", "is", null);
    
    if (personsError) throw personsError;
    
    // Create monthly report HTML
    const equipmentRows = equipment.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.inventory_number || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.barcode || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.location?.name || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.status}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.next_check_date ? new Date(item.next_check_date).toLocaleDateString('de-DE') : '-'}</td>
      </tr>
    `).join('');
    
    const reportHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
          <h1 style="color: #2563eb;">Monatlicher Ausrüstungsbericht</h1>
          <p>Dies ist der monatliche Bericht aller Ausrüstungen und deren nächstem Wartungsdatum.</p>
          
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Inventarnummer</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Barcode</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Standort</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Status</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Nächste Wartung</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows}
            </tbody>
          </table>
          
          <p>Dieser Bericht wurde automatisch erstellt.</p>
        </body>
      </html>
    `;
    
    // Send emails to all persons with email addresses
    const sentEmails = [];
    
    for (const person of persons) {
      if (!person.email) continue;
      
      const emailResult = await resend.emails.send({
        from: "Monatlicher Ausrüstungsbericht <onboarding@resend.dev>",
        to: [person.email],
        subject: `Monatlicher Ausrüstungsbericht - ${new Date().toLocaleDateString('de-DE')}`,
        html: reportHtml,
      });
      
      sentEmails.push({
        email: person.email,
        name: `${person.first_name} ${person.last_name}`,
        status: emailResult.error ? 'error' : 'sent'
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent monthly report to ${sentEmails.length} recipients`,
        details: sentEmails
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error sending monthly report:", error);
    throw error;
  }
}
