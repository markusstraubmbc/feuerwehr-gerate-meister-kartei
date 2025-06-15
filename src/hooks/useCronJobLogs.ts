
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CronJobLog {
  id: string;
  job_name: string;
  status: 'running' | 'success' | 'error';
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  details: any;
  error_message: string | null;
  created_at: string;
}

export const useCronJobLogs = (jobName?: string, limit = 50) => {
  return useQuery({
    queryKey: ["cron-job-logs", jobName, limit],
    queryFn: async () => {
      let query = supabase
        .from("cron_job_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (jobName) {
        query = query.eq("job_name", jobName);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CronJobLog[];
    },
  });
};

export const useCronJobStats = () => {
  return useQuery({
    queryKey: ["cron-job-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cron_job_logs")
        .select("job_name, status, started_at")
        .order("started_at", { ascending: false });

      if (error) throw error;

      // Group by job name and calculate stats
      const stats: { [key: string]: any } = {};
      
      data.forEach((log) => {
        if (!stats[log.job_name]) {
          stats[log.job_name] = {
            total: 0,
            success: 0,
            error: 0,
            running: 0,
            lastRun: null,
            lastStatus: null
          };
        }
        
        stats[log.job_name].total++;
        stats[log.job_name][log.status]++;
        
        if (!stats[log.job_name].lastRun || log.started_at > stats[log.job_name].lastRun) {
          stats[log.job_name].lastRun = log.started_at;
          stats[log.job_name].lastStatus = log.status;
        }
      });

      return stats;
    },
  });
};
