
-- Tabelle für Einsätze/Übungen
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('einsatz', 'übung')),
  mission_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  responsible_person_id UUID REFERENCES public.persons(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabelle für die Zuordnung von Ausrüstung zu Einsätzen/Übungen
CREATE TABLE public.mission_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES public.persons(id),
  notes TEXT,
  UNIQUE(mission_id, equipment_id)
);

-- Index für bessere Performance
CREATE INDEX idx_mission_equipment_mission_id ON public.mission_equipment(mission_id);
CREATE INDEX idx_mission_equipment_equipment_id ON public.mission_equipment(equipment_id);
CREATE INDEX idx_missions_date ON public.missions(mission_date);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
