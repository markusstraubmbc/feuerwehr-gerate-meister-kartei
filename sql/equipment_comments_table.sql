
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

-- Allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.equipment_comments
    USING (true)
    WITH CHECK (true);
