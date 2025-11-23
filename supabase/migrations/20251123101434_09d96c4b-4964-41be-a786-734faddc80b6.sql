-- Create table for mission equipment templates
CREATE TABLE public.mission_equipment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_reference TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for template equipment items
CREATE TABLE public.template_equipment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.mission_equipment_templates(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mission_equipment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_equipment_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all on mission_equipment_templates" 
ON public.mission_equipment_templates 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all on template_equipment_items" 
ON public.template_equipment_items 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_mission_equipment_templates_updated_at
BEFORE UPDATE ON public.mission_equipment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();