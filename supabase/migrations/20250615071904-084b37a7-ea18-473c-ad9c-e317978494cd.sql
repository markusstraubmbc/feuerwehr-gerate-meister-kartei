
-- Create table for cron job logs
CREATE TABLE public.cron_job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_cron_job_logs_job_name ON public.cron_job_logs(job_name);
CREATE INDEX idx_cron_job_logs_started_at ON public.cron_job_logs(started_at);

-- Enable RLS
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is system data)
CREATE POLICY "Allow all operations on cron_job_logs" 
  ON public.cron_job_logs 
  FOR ALL 
  USING (true);
