
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pkhkswzixavvildtoxxt.supabase.co";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Get current date and time
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    console.log(`Cron job running at ${today.toISOString()}`);
    
    // Call upcoming maintenance notifications
    const upcomingResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/maintenance-notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ type: "upcoming" })
      }
    );

    const upcomingResult = await upcomingResponse.json();
    console.log("Upcoming maintenance notifications result:", upcomingResult);

    // Check if we should send monthly report (on the configured day of month)
    // For now, let's send it on the 1st of every month as default
    let monthlyResult = null;
    if (dayOfMonth === 1) {
      const monthlyResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/maintenance-notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ type: "monthly-report" })
        }
      );

      monthlyResult = await monthlyResponse.json();
      console.log("Monthly report result:", monthlyResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cron job completed successfully",
        timestamp: today.toISOString(),
        upcomingNotifications: upcomingResult,
        monthlyReport: monthlyResult
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in email-cron function:", error);
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
