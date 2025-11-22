-- Create enums
CREATE TYPE equipment_status AS ENUM ('einsatzbereit', 'defekt', 'prüfung fällig', 'wartung');
CREATE TYPE maintenance_status AS ENUM ('geplant', 'ausstehend', 'in_bearbeitung', 'abgeschlossen');
CREATE TYPE mission_type AS ENUM ('einsatz', 'übung');

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create persons table
CREATE TABLE public.persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  inventory_number TEXT UNIQUE,
  barcode TEXT UNIQUE,
  serial_number TEXT,
  manufacturer TEXT,
  model TEXT,
  category_id UUID REFERENCES public.categories(id),
  status equipment_status NOT NULL DEFAULT 'einsatzbereit',
  location_id UUID REFERENCES public.locations(id),
  responsible_person_id UUID REFERENCES public.persons(id),
  notes TEXT,
  purchase_date DATE,
  replacement_date DATE,
  last_check_date DATE,
  next_check_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_templates table
CREATE TABLE public.maintenance_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  interval_months INTEGER NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  responsible_person_id UUID REFERENCES public.persons(id),
  checklist_url TEXT,
  estimated_minutes INTEGER,
  checks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_records table
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.maintenance_templates(id),
  due_date DATE NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'ausstehend',
  performed_date DATE,
  performed_by UUID REFERENCES public.persons(id),
  notes TEXT,
  minutes_spent INTEGER,
  documentation_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment_comments table
CREATE TABLE public.equipment_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.persons(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mission_type mission_type NOT NULL,
  mission_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  responsible_persons TEXT,
  vehicles TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mission_equipment table
CREATE TABLE public.mission_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES public.persons(id),
  notes TEXT,
  UNIQUE(mission_id, equipment_id)
);

-- Create settings table
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cron_job_logs table
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

-- Create indexes
CREATE INDEX idx_equipment_category ON public.equipment(category_id);
CREATE INDEX idx_equipment_location ON public.equipment(location_id);
CREATE INDEX idx_equipment_responsible_person ON public.equipment(responsible_person_id);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_comments_equipment_id ON public.equipment_comments(equipment_id);
CREATE INDEX idx_maintenance_records_equipment ON public.maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_records_template ON public.maintenance_records(template_id);
CREATE INDEX idx_maintenance_records_status ON public.maintenance_records(status);
CREATE INDEX idx_maintenance_records_due_date ON public.maintenance_records(due_date);
CREATE INDEX idx_mission_equipment_mission_id ON public.mission_equipment(mission_id);
CREATE INDEX idx_mission_equipment_equipment_id ON public.mission_equipment(equipment_id);
CREATE INDEX idx_missions_date ON public.missions(mission_date);
CREATE INDEX idx_cron_job_logs_job_name ON public.cron_job_logs(job_name);
CREATE INDEX idx_cron_job_logs_started_at ON public.cron_job_logs(started_at);

-- Create update_updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_templates_updated_at BEFORE UPDATE ON public.maintenance_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_comments_updated_at BEFORE UPDATE ON public.equipment_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get equipment comments
CREATE OR REPLACE FUNCTION public.get_equipment_comments(equipment_id_param UUID)
RETURNS SETOF JSON
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', c.id,
      'equipment_id', c.equipment_id,
      'person_id', c.person_id,
      'comment', c.comment,
      'created_at', c.created_at,
      'person', json_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name
      )
    )
  FROM 
    equipment_comments c
    JOIN persons p ON c.person_id = p.id
  WHERE 
    c.equipment_id = equipment_id_param
  ORDER BY 
    c.created_at DESC;
END;
$$;

-- Create function to add equipment comments
CREATE OR REPLACE FUNCTION public.add_equipment_comment(equipment_id_param UUID, person_id_param UUID, comment_param TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO equipment_comments (
    equipment_id,
    person_id,
    comment
  ) VALUES (
    equipment_id_param,
    person_id_param,
    comment_param
  );
END;
$$;

-- Create function to truncate table (for backup/restore)
CREATE OR REPLACE FUNCTION public.truncate_table(table_name TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', table_name);
END;
$$;

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now)
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on persons" ON public.persons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on maintenance_templates" ON public.maintenance_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on maintenance_records" ON public.maintenance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on equipment_comments" ON public.equipment_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on missions" ON public.missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mission_equipment" ON public.mission_equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cron_job_logs" ON public.cron_job_logs FOR ALL USING (true) WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance_docs', 'maintenance_docs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('checklists', 'checklists', false);

-- Storage policies for maintenance_docs
CREATE POLICY "Allow all operations on maintenance_docs" ON storage.objects FOR ALL USING (bucket_id = 'maintenance_docs') WITH CHECK (bucket_id = 'maintenance_docs');

-- Storage policies for checklists
CREATE POLICY "Allow all operations on checklists" ON storage.objects FOR ALL USING (bucket_id = 'checklists') WITH CHECK (bucket_id = 'checklists');