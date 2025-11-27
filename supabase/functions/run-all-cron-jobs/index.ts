import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = new Date();
    const results: any[] = [];

    // List of all cron job functions to execute
    const cronJobs = [
      { name: "maintenance-auto-generator", function: "maintenance-auto-generator" },
      { name: "email-scheduler", function: "email-scheduler", body: { type: "upcoming" } },
      { name: "maintenance-notifications", function: "maintenance-notifications", body: { type: "upcoming" } },
      { name: "weekly-report", function: "weekly-report" }
    ];

    console.log(`Starting execution of ${cronJobs.length} cron jobs...`);

    // Execute all cron jobs sequentially
    for (const job of cronJobs) {
      const jobStartTime = new Date();
      
      try {
        console.log(`Executing ${job.name}...`);
        
        const { data, error } = await supabase.functions.invoke(job.function, {
          body: job.body || {}
        });

        const jobEndTime = new Date();
        const jobDuration = Math.floor((jobEndTime.getTime() - jobStartTime.getTime()) / 1000);

        if (error) {
          console.error(`Error in ${job.name}:`, error);
          results.push({
            job: job.name,
            status: "error",
            error: error.message,
            duration: jobDuration
          });
        } else {
          console.log(`${job.name} completed successfully`);
          results.push({
            job: job.name,
            status: "success",
            result: data,
            duration: jobDuration
          });
        }
      } catch (error) {
        const jobEndTime = new Date();
        const jobDuration = Math.floor((jobEndTime.getTime() - jobStartTime.getTime()) / 1000);
        
        console.error(`Exception in ${job.name}:`, error);
        results.push({
          job: job.name,
          status: "error",
          error: error.message,
          duration: jobDuration
        });
      }
    }

    const endTime = new Date();
    const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const successCount = results.filter(r => r.status === "success").length;
    const errorCount = results.filter(r => r.status === "error").length;

    // Log the execution to cron_job_logs
    await supabase.from("cron_job_logs").insert({
      job_name: "run-all-cron-jobs",
      status: errorCount === 0 ? "success" : errorCount === cronJobs.length ? "error" : "partial_success",
      started_at: startTime.toISOString(),
      completed_at: endTime.toISOString(),
      duration_seconds: totalDuration,
      details: {
        total_jobs: cronJobs.length,
        successful: successCount,
        errors: errorCount,
        results: results
      },
      error_message: errorCount > 0 ? `${errorCount} job(s) failed` : null
    });

    return new Response(
      JSON.stringify({
        success: errorCount === 0,
        message: `Executed ${cronJobs.length} cron jobs: ${successCount} succeeded, ${errorCount} failed`,
        total_duration: totalDuration,
        results: results
      }),
      {
        status: errorCount === 0 ? 200 : 207, // 207 = Multi-Status
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in run-all-cron-jobs function:", error);
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
