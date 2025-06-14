
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, test_email } = await req.json();
    
    console.log(`Email scheduler called with type: ${type}, test_email: ${test_email}`);
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pkhkswzixavvildtoxxt.supabase.co";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Call the maintenance notifications function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/maintenance-notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          type,
          test_email: test_email || undefined
        })
      }
    );

    const result = await response.json();
    console.log("Maintenance notifications result:", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Triggered ${type} notifications`,
        result: result
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in email-scheduler function:", error);
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
