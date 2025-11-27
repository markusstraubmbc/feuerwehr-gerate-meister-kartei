-- Create equipment_actions table for managing action types
CREATE TABLE IF NOT EXISTS public.equipment_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_actions ENABLE ROW LEVEL SECURITY;

-- Create policy for equipment_actions
CREATE POLICY "Allow all on equipment_actions" 
ON public.equipment_actions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add action_id field to equipment_comments
ALTER TABLE public.equipment_comments 
ADD COLUMN action_id UUID REFERENCES public.equipment_actions(id) ON DELETE SET NULL;

-- Insert default actions
INSERT INTO public.equipment_actions (name, description) VALUES
  ('Kleidung gewaschen', 'Kleidung wurde gewaschen'),
  ('Imprägniert', 'Ausrüstung wurde imprägniert');

-- Update the add_equipment_comment function to include action_id
CREATE OR REPLACE FUNCTION public.add_equipment_comment(
  comment_param TEXT,
  equipment_id_param UUID,
  person_id_param UUID,
  action_id_param UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.equipment_comments (comment, equipment_id, person_id, action_id)
  VALUES (comment_param, equipment_id_param, person_id_param, action_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;