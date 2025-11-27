import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

  try {
    const {
      missionId,
      missionTitle,
      missionType,
      missionDate,
      pdfBase64,
      responsiblePersonsEmails = [],
    }: MissionReportRequest = await req.json();

    console.log(`Processing mission report for: ${missionTitle} (${missionId})`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get mission report recipients from settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "mission_report_recipients")
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw new Error("Fehler beim Laden der E-Mail-Einstellungen");
    }

    if (!settingsData?.value || (settingsData.value as string[]).length === 0) {
      console.log("No mission report recipients configured, skipping email send");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Keine E-Mail-Adressen für Einsatzberichte konfiguriert" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const reportRecipients = settingsData.value as string[];
    console.log(`Sending report to: ${reportRecipients.join(", ")}`);

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

    // Prepare email recipients - CC includes all responsible persons
    const allCcEmails = [...responsiblePersonsEmails];
    
    // Remove duplicates and filter out empty emails
    const ccEmails = [...new Set(allCcEmails)]
      .filter(email => email && email.trim().length > 0)
      .filter(email => !reportRecipients.includes(email));

    // Convert base64 to buffer for attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));

    const reportType = missionType === "einsatz" ? "Einsatz" : "Übung";
    const fileName = `${reportType}-${missionTitle.replace(/[^a-zA-Z0-9]/g, "_")}-${missionDate}.pdf`;

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: reportRecipients,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: `${reportType}bericht: ${missionTitle} - ${missionDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${reportType}bericht</h2>
          <p><strong>${missionTitle}</strong></p>
          <p><strong>Datum:</strong> ${missionDate}</p>
          <p>Anbei finden Sie den vollständigen ${reportType}bericht als PDF-Anhang.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Diese E-Mail wurde automatisch generiert.
            ${ccEmails.length > 0 ? `<br>Kopie an: ${ccEmails.join(", ")}` : ""}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        sentTo: reportRecipients,
        ccSentTo: ccEmails 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-mission-report function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
