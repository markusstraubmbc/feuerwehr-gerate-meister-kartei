
-- Create equipment comments table
CREATE TABLE IF NOT EXISTS public.equipment_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.persons(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by equipment
CREATE INDEX IF NOT EXISTS idx_equipment_comments_equipment_id ON public.equipment_comments(equipment_id);

-- Add RLS policies for equipment_comments table
ALTER TABLE public.equipment_comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can make this more restrictive later)
CREATE POLICY "Enable all operations for equipment comments" ON public.equipment_comments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create or replace the function to get equipment comments
CREATE OR REPLACE FUNCTION public.get_equipment_comments(equipment_id_param uuid)
RETURNS SETOF json
LANGUAGE plpgsql
AS $function$
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
$function$;

-- Create or replace the function to add equipment comments
CREATE OR REPLACE FUNCTION public.add_equipment_comment(equipment_id_param uuid, person_id_param uuid, comment_param text)
RETURNS void
LANGUAGE plpgsql
AS $function$
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
$function$;
