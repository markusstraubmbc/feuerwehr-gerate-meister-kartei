import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MissionReportRequest {
  missionId: string;
  missionTitle: string;
  missionType: "einsatz" | "übung";
  missionDate: string;
  pdfBase64: string;
  responsiblePersonsEmails?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(supabaseUrl, supabaseKey);
  let logId: string | undefined;

  try {
    const {
      missionId,
      missionTitle,
      missionType,
      missionDate,
      pdfBase64,
      responsiblePersonsEmails = [],
    }: MissionReportRequest = await req.json();

    console.log("Processing mission report for:", missionTitle, `(${missionId})`);

    // Log cron job start
    const { data: logData } = await supabase
      .from("cron_job_logs")
      .insert({
        job_name: "send-mission-report",
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    logId = logData?.id;

    // Get mission report recipients from settings
    const { data: recipientsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "mission_report_recipients")
      .maybeSingle();

    const recipients = Array.isArray(recipientsData?.value) ? recipientsData.value : [];
    
    // Combine configured recipients with responsible persons emails
    const allRecipients = [...new Set([...recipients, ...responsiblePersonsEmails])];

    console.log("Sending report to:", allRecipients.join(", "));

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
        JSON.stringify({ success: false, message: "Keine Empfänger konfiguriert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const senderName = senderNameData?.value as string || "Einsatzberichte";
    const fromField = `${senderName} <${senderEmail}>`;
    
    // Fetch mission details for email body
    const { data: missionData } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();
    
    // Fetch equipment for this mission
    const { data: equipmentData } = await supabase
      .from("mission_equipment")
      .select(`
        *,
        equipment:equipment_id (
          name,
          inventory_number,
          category:category_id (name),
          location:location_id (name)
        ),
        added_by_person:added_by (
          first_name,
          last_name
        )
      `)
      .eq("mission_id", missionId);
    
    // Build HTML email body with mission details
    const typeLabel = missionType === "einsatz" ? "Einsatz" : "Übung";
    
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">
          ${typeLabel}bericht: ${missionTitle}
        </h1>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #374151; margin-top: 0;">Grundinformationen</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Typ:</td>
              <td style="padding: 8px 0;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Datum:</td>
              <td style="padding: 8px 0;">${missionDate}</td>
            </tr>
    `;
    
    if (missionData?.start_time) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Startzeit:</td>
              <td style="padding: 8px 0;">${missionData.start_time}</td>
            </tr>
      `;
    }
    
    if (missionData?.end_time) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Endzeit:</td>
              <td style="padding: 8px 0;">${missionData.end_time}</td>
            </tr>
      `;
    }
    
    if (missionData?.location) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Ort:</td>
              <td style="padding: 8px 0;">${missionData.location}</td>
            </tr>
      `;
    }
    
    if (missionData?.responsible_persons) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Verantwortlich:</td>
              <td style="padding: 8px 0;">${missionData.responsible_persons}</td>
            </tr>
      `;
    }
    
    if (missionData?.vehicles) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Fahrzeuge:</td>
              <td style="padding: 8px 0;">${missionData.vehicles}</td>
            </tr>
      `;
    }
    
    emailHtml += `
          </table>
        </div>
    `;
    
    if (missionData?.description) {
      emailHtml += `
        <div style="margin: 20px 0;">
          <h2 style="color: #374151;">Beschreibung</h2>
          <p style="line-height: 1.6; color: #4b5563;">${missionData.description}</p>
        </div>
      `;
    }
    
    if (equipmentData && equipmentData.length > 0) {
      emailHtml += `
        <div style="margin: 20px 0;">
          <h2 style="color: #374151;">Verwendete Einsatzmittel (${equipmentData.length})</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; border: 1px solid #d1d5db;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Inventarnr.</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Name</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Kategorie</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Standort</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Hinzugefügt von</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      equipmentData.forEach((item: any, index: number) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb";
        emailHtml += `
              <tr style="background-color: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #d1d5db;">${item.equipment?.inventory_number || "-"}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${item.equipment?.name || "-"}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${item.equipment?.category?.name || "-"}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${item.equipment?.location?.name || "-"}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${item.added_by_person ? `${item.added_by_person.first_name} ${item.added_by_person.last_name}` : "-"}</td>
              </tr>
        `;
      });
      
      emailHtml += `
            </tbody>
          </table>
        </div>
      `;
    }
    
    emailHtml += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            PDF-Bericht ist dieser E-Mail als Anhang beigefügt.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            Dieser Bericht wurde automatisch generiert am ${new Date().toLocaleString("de-DE")}.
          </p>
        </div>
      </div>
    `;

    // Convert base64 to buffer for attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const fileName = `${typeLabel}-${missionTitle.replace(/[^a-zA-Z0-9]/g, "_")}-${missionDate}.pdf`;

    const { data, error } = await resend.emails.send({
      from: fromField,
      to: allRecipients,
      subject: `${typeLabel}bericht: ${missionTitle} - ${missionDate}`,
      html: emailHtml,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email sent successfully:", { data, error });

    // Update cron job log with success
    const duration = (Date.now() - startTime) / 1000;
    await supabase
      .from("cron_job_logs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        details: {
          message: `${typeLabel}bericht versendet`,
          mission_title: missionTitle,
          recipients: allRecipients,
          equipment_count: equipmentData?.length || 0,
        },
      })
      .eq("id", logId);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-mission-report:", error);
    
    // Update cron job log with error
    const duration = (Date.now() - startTime) / 1000;
    const supabase = createClient(supabaseUrl, supabaseKey);
    if (logId) {
      await supabase
        .from("cron_job_logs")
        .update({
          status: "error",
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          error_message: error.message,
        })
        .eq("id", logId);
    }
    
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
