-- Create table to track when maintenance notifications were sent for each equipment
CREATE TABLE IF NOT EXISTS public.maintenance_notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  maintenance_record_id UUID REFERENCES public.maintenance_records(id) ON DELETE SET NULL,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient lookup
CREATE INDEX idx_maintenance_notification_history_equipment_id ON public.maintenance_notification_history(equipment_id);
CREATE INDEX idx_maintenance_notification_history_notified_at ON public.maintenance_notification_history(notified_at);

-- Enable RLS
ALTER TABLE public.maintenance_notification_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all on maintenance_notification_history" 
ON public.maintenance_notification_history 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default setting for notification interval (7 days)
INSERT INTO public.settings (key, value)
VALUES ('maintenance_notification_interval_days', '7')
ON CONFLICT (key) DO NOTHING;