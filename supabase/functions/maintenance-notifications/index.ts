
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestBody = await req.json();
    const { type, testEmail, message, subject, senderDomain, fromEmail } = requestBody;
    
    console.log(`Processing ${type} notifications, testEmail: ${testEmail}`);

    // Get default sender domain from settings if not provided
    let emailSenderDomain = senderDomain || 'mailsend.straub-it.de';
    let emailFromAddress = fromEmail || 'wartungsmanagement';

    // Create sender email with proper format
    const senderEmail = `${emailFromAddress.includes('@') ? emailFromAddress.split('@')[0] : emailFromAddress}@${emailSenderDomain}`;
    const senderName = "Wartungsmanagement";
    const fromField = `${senderName} <${senderEmail}>`;

    if (type === "test") {
      // Handle test email
      if (!testEmail) {
        return new Response(
          JSON.stringify({ error: "Test email address is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Check if RESEND_API_KEY is available
      const apiKey = Deno.env.get("RESEND_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "RESEND_API_KEY not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      try {
        const emailResult = await resend.emails.send({
          from: fromField,
          to: [testEmail],
          subject: subject || "Test-E-Mail - Feuerwehr Inventar",
          html: `
            <h2>Test-E-Mail</h2>
            <p>Hallo,</p>
            <p>${message || 'Dies ist eine Test-E-Mail vom Feuerwehr Inventar System.'}</p>
            <p>Wenn Sie diese E-Mail erhalten haben, funktioniert die E-Mail-Konfiguration korrekt.</p>
            <p>Mit freundlichen Grüßen<br>Ihr Wartungsmanagement-Team</p>
          `,
        });

        console.log("Test email sent successfully:", emailResult);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Test-E-Mail wurde erfolgreich an ${testEmail} gesendet`,
            emailId: emailResult.data?.id
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );

      } catch (emailError) {
        console.error("Error sending test email:", emailError);
        return new Response(
          JSON.stringify({ 
            error: `Fehler beim Senden der E-Mail: ${emailError.message}`,
            details: emailError
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

    } else if (type === "upcoming") {
      // Get settings
      const { data: settings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "email_settings")
        .single();

      // Try to get sender domain and from email from settings
      if (settings?.value?.sender_domain) {
        emailSenderDomain = settings.value.sender_domain;
      }
      
      if (settings?.value?.from_email) {
        emailFromAddress = settings.value.from_email;
      }

      // Re-create sender email with proper format
      const senderEmail = `${emailFromAddress.includes('@') ? emailFromAddress.split('@')[0] : emailFromAddress}@${emailSenderDomain}`;
      const updatedFromField = `${senderName} <${senderEmail}>`;

      const upcomingDays = settings?.value?.upcoming_days_interval || 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + upcomingDays);

      // Get upcoming maintenance tasks
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment:equipment_id (name, barcode),
          template:template_id (name),
          performer:performed_by (first_name, last_name, email)
        `)
        .eq("status", "ausstehend")
        .lte("due_date", futureDate.toISOString())
        .order("due_date", { ascending: true });

      if (maintenanceError) throw maintenanceError;

      console.log(`Found ${maintenanceData?.length || 0} upcoming maintenance tasks`);
      
      const emailPromises = [];
      const emailDetails = [];

      for (const maintenance of maintenanceData || []) {
        if (!maintenance.performer?.email && !testEmail) continue;
        
        const recipient = testEmail || maintenance.performer.email;
        const recipientName = testEmail ? "Test User" : `${maintenance.performer.first_name} ${maintenance.performer.last_name}`;
        
        const dueDate = new Date(maintenance.due_date).toLocaleDateString('de-DE');
        
        const emailPromise = resend.emails.send({
          from: updatedFromField,
          to: [recipient],
          subject: `Wartung fällig: ${maintenance.equipment.name}`,
          html: `
            <h2>Wartungsbenachrichtigung</h2>
            <p>Hallo ${recipientName},</p>
            <p>die folgende Wartung ist fällig:</p>
            <ul>
              <li><strong>Ausrüstung:</strong> ${maintenance.equipment.name}</li>
              <li><strong>Barcode:</strong> ${maintenance.equipment.barcode || 'Nicht verfügbar'}</li>
              <li><strong>Wartungstyp:</strong> ${maintenance.template?.name || 'Allgemeine Wartung'}</li>
              <li><strong>Fälligkeitsdatum:</strong> ${dueDate}</li>
            </ul>
            <p>Bitte führen Sie die Wartung zeitnah durch und dokumentieren Sie sie im System.</p>
            <p>Mit freundlichen Grüßen<br>Ihr Wartungsmanagement-Team</p>
          `,
        });

        emailPromises.push(emailPromise);
        emailDetails.push({
          email: recipient,
          name: recipientName,
          equipment: maintenance.equipment.name,
          barcode: maintenance.equipment.barcode
        });
      }

      const emailResults = await Promise.allSettled(emailPromises);
      
      // Update email details with results
      emailResults.forEach((result, index) => {
        emailDetails[index].status = result.status === 'fulfilled' ? 'success' : 'error';
        if (result.status === 'rejected') {
          emailDetails[index].error = result.reason?.message || 'Unknown error';
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Sent ${emailResults.filter(r => r.status === 'fulfilled').length} email notifications`,
          details: emailDetails
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } else if (type === "monthly-report") {
      // Get settings for sender domain and from email
      const { data: settings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "email_settings")
        .single();

      // Try to get sender domain and from email from settings
      if (settings?.value?.sender_domain) {
        emailSenderDomain = settings.value.sender_domain;
      }
      
      if (settings?.value?.from_email) {
        emailFromAddress = settings.value.from_email;
      }

      // Re-create sender email with proper format
      const senderEmail = `${emailFromAddress.includes('@') ? emailFromAddress.split('@')[0] : emailFromAddress}@${emailSenderDomain}`;
      const updatedFromField = `${senderName} <${senderEmail}>`;

      // Get all persons with email addresses for the monthly report
      const { data: persons } = await supabase
        .from("persons")
        .select("first_name, last_name, email")
        .not("email", "is", null);

      // Get maintenance statistics for the past month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const { data: completedMaintenance } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment:equipment_id (name, barcode),
          template:template_id (name)
        `)
        .eq("status", "abgeschlossen")
        .gte("performed_date", lastMonth.toISOString());

      const { data: pendingMaintenance } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment:equipment_id (name, barcode),
          template:template_id (name)
        `)
        .eq("status", "ausstehend");

      const emailPromises = [];
      const emailDetails = [];

      // Send to test email if provided, otherwise to all persons with email
      const recipients = testEmail ? 
        [{ email: testEmail, first_name: "Test", last_name: "User" }] : 
        (persons || []);

      for (const person of recipients) {
        if (!person.email) continue;
        
        const emailPromise = resend.emails.send({
          from: updatedFromField,
          to: [person.email],
          subject: "Monatlicher Wartungsbericht",
          html: `
            <h2>Monatlicher Wartungsbericht</h2>
            <p>Hallo ${person.first_name} ${person.last_name},</p>
            
            <h3>Wartungsstatistik des letzten Monats</h3>
            <ul>
              <li><strong>Abgeschlossene Wartungen:</strong> ${completedMaintenance?.length || 0}</li>
              <li><strong>Ausstehende Wartungen:</strong> ${pendingMaintenance?.length || 0}</li>
            </ul>
            
            ${completedMaintenance?.length ? `
              <h3>Abgeschlossene Wartungen</h3>
              <ul>
                ${completedMaintenance.map(m => `
                  <li>${m.equipment.name} (${m.equipment.barcode || 'Kein Barcode'}) - ${m.template?.name || 'Allgemeine Wartung'}</li>
                `).join('')}
              </ul>
            ` : ''}
            
            ${pendingMaintenance?.length ? `
              <h3>Ausstehende Wartungen</h3>
              <ul>
                ${pendingMaintenance.slice(0, 10).map(m => `
                  <li>${m.equipment.name} (${m.equipment.barcode || 'Kein Barcode'}) - Fällig: ${new Date(m.due_date).toLocaleDateString('de-DE')}</li>
                `).join('')}
                ${pendingMaintenance.length > 10 ? `<li>... und ${pendingMaintenance.length - 10} weitere</li>` : ''}
              </ul>
            ` : ''}
            
            <p>Mit freundlichen Grüßen<br>Ihr Wartungsmanagement-Team</p>
          `,
        });

        emailPromises.push(emailPromise);
        emailDetails.push({
          email: person.email,
          name: `${person.first_name} ${person.last_name}`
        });
      }

      const emailResults = await Promise.allSettled(emailPromises);
      
      // Update email details with results
      emailResults.forEach((result, index) => {
        emailDetails[index].status = result.status === 'fulfilled' ? 'success' : 'error';
        if (result.status === 'rejected') {
          emailDetails[index].error = result.reason?.message || 'Unknown error';
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Sent monthly report to ${emailResults.filter(r => r.status === 'fulfilled').length} recipients`,
          details: emailDetails
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid notification type" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in maintenance-notifications function:", error);
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
