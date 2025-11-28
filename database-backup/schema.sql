-- ================================================================
-- FEUERWEHR INVENTAR SYSTEM - DATABASE SCHEMA
-- Generated: 2024-11-28
-- ================================================================

-- ================================================================
-- ENUMS
-- ================================================================

CREATE TYPE equipment_status AS ENUM ('einsatzbereit', 'defekt', 'prüfung fällig', 'wartung');
CREATE TYPE maintenance_status AS ENUM ('geplant', 'ausstehend', 'in_bearbeitung', 'abgeschlossen');
CREATE TYPE mission_type AS ENUM ('einsatz', 'übung');

-- ================================================================
-- TABLES
-- ================================================================

-- Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Persons Table
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    notification_interval_days INTEGER,
    responsible_person_id UUID REFERENCES public.persons(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    inventory_number TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    model TEXT,
    barcode TEXT,
    notes TEXT,
    status equipment_status NOT NULL DEFAULT 'einsatzbereit',
    category_id UUID REFERENCES public.categories(id),
    location_id UUID REFERENCES public.locations(id),
    responsible_person_id UUID REFERENCES public.persons(id),
    purchase_date DATE,
    replacement_date DATE,
    last_check_date DATE,
    next_check_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment Actions Table
CREATE TABLE IF NOT EXISTS public.equipment_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment Comments Table
CREATE TABLE IF NOT EXISTS public.equipment_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.persons(id),
    action_id UUID REFERENCES public.equipment_actions(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Maintenance Templates Table
CREATE TABLE IF NOT EXISTS public.maintenance_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    interval_months INTEGER NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    responsible_person_id UUID REFERENCES public.persons(id),
    checks TEXT,
    checklist_url TEXT,
    estimated_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Maintenance Records Table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id),
    template_id UUID REFERENCES public.maintenance_templates(id),
    due_date DATE NOT NULL,
    status maintenance_status NOT NULL DEFAULT 'ausstehend',
    performed_date DATE,
    performed_by UUID REFERENCES public.persons(id),
    minutes_spent INTEGER,
    notes TEXT,
    documentation_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Maintenance Notification History Table
CREATE TABLE IF NOT EXISTS public.maintenance_notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id),
    maintenance_record_id UUID REFERENCES public.maintenance_records(id),
    notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Missions Table
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    mission_type mission_type NOT NULL,
    mission_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    location TEXT,
    vehicles TEXT,
    responsible_persons TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mission Equipment Table
CREATE TABLE IF NOT EXISTS public.mission_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.missions(id),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id),
    added_by UUID REFERENCES public.persons(id),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mission Equipment Templates Table
CREATE TABLE IF NOT EXISTS public.mission_equipment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    vehicle_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Template Equipment Items Table
CREATE TABLE IF NOT EXISTS public.template_equipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.mission_equipment_templates(id),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Template Inventory Checks Table
CREATE TABLE IF NOT EXISTS public.template_inventory_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.mission_equipment_templates(id),
    checked_by UUID REFERENCES public.persons(id),
    status TEXT DEFAULT 'in_progress',
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory Check Items Table
CREATE TABLE IF NOT EXISTS public.inventory_check_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_check_id UUID REFERENCES public.template_inventory_checks(id),
    equipment_id UUID REFERENCES public.equipment(id),
    status TEXT DEFAULT 'present',
    replacement_equipment_id UUID REFERENCES public.equipment(id),
    notes TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cron Job Logs Table
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_equipment_comments_equipment_id ON public.equipment_comments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category_id ON public.equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location_id ON public.equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_equipment_id ON public.maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON public.maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_due_date ON public.maintenance_records(due_date);
CREATE INDEX IF NOT EXISTS idx_mission_equipment_mission_id ON public.mission_equipment(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_equipment_equipment_id ON public.mission_equipment(equipment_id);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Update updated_at column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add equipment comment function
CREATE OR REPLACE FUNCTION public.add_equipment_comment(
    equipment_id_param UUID,
    person_id_param UUID,
    comment_param TEXT,
    action_id_param UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.equipment_comments (comment, equipment_id, person_id, action_id)
  VALUES (comment_param, equipment_id_param, person_id_param, action_id_param);
END;
$$;

-- Get equipment comments function
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

-- Truncate table function for backup restore
CREATE OR REPLACE FUNCTION public.truncate_table(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', table_name);
END;
$$;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Equipment updated_at trigger
DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Equipment Comments updated_at trigger
DROP TRIGGER IF EXISTS update_equipment_comments_updated_at ON public.equipment_comments;
CREATE TRIGGER update_equipment_comments_updated_at
    BEFORE UPDATE ON public.equipment_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Maintenance Templates updated_at trigger
DROP TRIGGER IF EXISTS update_maintenance_templates_updated_at ON public.maintenance_templates;
CREATE TRIGGER update_maintenance_templates_updated_at
    BEFORE UPDATE ON public.maintenance_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Maintenance Records updated_at trigger
DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON public.maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at
    BEFORE UPDATE ON public.maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Missions updated_at trigger
DROP TRIGGER IF EXISTS update_missions_updated_at ON public.missions;
CREATE TRIGGER update_missions_updated_at
    BEFORE UPDATE ON public.missions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Mission Equipment Templates updated_at trigger
DROP TRIGGER IF EXISTS update_mission_equipment_templates_updated_at ON public.mission_equipment_templates;
CREATE TRIGGER update_mission_equipment_templates_updated_at
    BEFORE UPDATE ON public.mission_equipment_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Equipment Actions updated_at trigger
DROP TRIGGER IF EXISTS update_equipment_actions_updated_at ON public.equipment_actions;
CREATE TRIGGER update_equipment_actions_updated_at
    BEFORE UPDATE ON public.equipment_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Settings updated_at trigger
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_equipment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_inventory_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simple policy for internal application)
CREATE POLICY "Allow all on categories" ON public.categories USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on locations" ON public.locations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on persons" ON public.persons USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on equipment" ON public.equipment USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on equipment_actions" ON public.equipment_actions USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on equipment_comments" ON public.equipment_comments USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on maintenance_templates" ON public.maintenance_templates USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on maintenance_records" ON public.maintenance_records USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on maintenance_notification_history" ON public.maintenance_notification_history USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on missions" ON public.missions USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mission_equipment" ON public.mission_equipment USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mission_equipment_templates" ON public.mission_equipment_templates USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on template_equipment_items" ON public.template_equipment_items USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on template_inventory_checks" ON public.template_inventory_checks USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inventory_check_items" ON public.inventory_check_items USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON public.settings USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cron_job_logs" ON public.cron_job_logs USING (true) WITH CHECK (true);

-- ================================================================
-- END OF SCHEMA
-- ================================================================
