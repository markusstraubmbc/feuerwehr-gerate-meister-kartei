
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let startTime = new Date()

  try {
    // Safely parse request body with fallback to empty object
    let requestBody: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        requestBody = JSON.parse(text);
      }
    } catch (parseError) {
      console.log("No valid JSON body provided, using defaults");
    }
    
    const { type = "upcoming", test_email } = requestBody;
    
    const jobName = `email-scheduler-${type}`
    startTime = new Date()
    
    // Log job start
    const { data: logEntry } = await supabase
      .from('cron_job_logs')
      .insert({
        job_name: jobName,
        status: 'running',
        started_at: startTime.toISOString()
      })
      .select()
      .single()
    
    console.log(`Email scheduler called with type: ${type}, test_email: ${test_email}`);

    // Call the maintenance notifications function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/maintenance-notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({ 
          type,
          testEmail: test_email || undefined
        })
      }
    );

    const result = await response.json();
    console.log("Maintenance notifications result:", result);

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    
    const finalResult = {
      success: true,
      message: `Triggered ${type} notifications`,
      result: result
    }

    // Update log entry with completion info
    if (logEntry) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: response.ok ? 'success' : 'error',
          completed_at: endTime.toISOString(),
          duration_seconds: duration,
          details: finalResult,
          error_message: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : null
        })
        .eq('id', logEntry.id)
    }

    return new Response(
      JSON.stringify(finalResult),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in email-scheduler function:", error);
    
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    
    // Log error
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email-scheduler-error',
        status: 'error',
        started_at: new Date().toISOString(),
        completed_at: endTime.toISOString(),
        duration_seconds: duration,
        error_message: error.message,
        details: { error: error.message }
      })

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
