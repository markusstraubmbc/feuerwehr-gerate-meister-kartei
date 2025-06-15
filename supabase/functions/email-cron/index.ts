
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
  
  const jobName = 'email-cron'
  const startTime = new Date()
  
  try {
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

    console.log('Starting email cron job...')
    
    // Get current date and time
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    console.log(`Email cron job running at ${today.toISOString()}`);
    
    let upcomingResult = null
    let monthlyResult = null
    let errors = 0

    try {
      // Call upcoming maintenance notifications
      const upcomingResponse = await fetch(
        `${supabaseUrl}/functions/v1/maintenance-notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({ type: "upcoming" })
        }
      );

      upcomingResult = await upcomingResponse.json();
      console.log("Upcoming maintenance notifications result:", upcomingResult);
    } catch (error) {
      console.error("Error calling upcoming notifications:", error);
      errors++
    }

    // Check if we should send monthly report (on the configured day of month)
    // For now, let's send it on the 1st of every month as default
    if (dayOfMonth === 1) {
      try {
        const monthlyResponse = await fetch(
          `${supabaseUrl}/functions/v1/maintenance-notifications`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({ type: "monthly-report" })
          }
        );

        monthlyResult = await monthlyResponse.json();
        console.log("Monthly report result:", monthlyResult);
      } catch (error) {
        console.error("Error calling monthly report:", error);
        errors++
      }
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    
    const result = {
      success: true,
      message: "Email cron job completed",
      timestamp: today.toISOString(),
      upcomingNotifications: upcomingResult,
      monthlyReport: monthlyResult,
      errors: errors
    }
    
    // Update log entry with completion info
    if (logEntry) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: errors > 0 ? 'error' : 'success',
          completed_at: endTime.toISOString(),
          duration_seconds: duration,
          details: result,
          error_message: errors > 0 ? `${errors} errors occurred during email processing` : null
        })
        .eq('id', logEntry.id)
    }

    console.log(`Email cron job completed: ${errors} errors`)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in email-cron function:", error);
    
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    
    // Log error
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: jobName,
        status: 'error',
        started_at: startTime.toISOString(),
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
