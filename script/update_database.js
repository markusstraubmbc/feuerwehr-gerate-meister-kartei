
// This script should be run in the browser console
// It adds the necessary equipment_comments table

// Define the SQL for creating the equipment_comments table
const createCommentsTableSQL = `
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
`;

// Define the SQL for updating maintenance_templates table
const updateMaintenanceTemplatesSQL = `
-- Add estimated_minutes to maintenance_templates if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'maintenance_templates' AND column_name = 'estimated_minutes'
    ) THEN
        ALTER TABLE public.maintenance_templates ADD COLUMN estimated_minutes INTEGER;
    END IF;
END $$;
`;

// Instructions for running these SQL commands in Supabase
console.log("To create the equipment_comments table and update maintenance_templates, please go to Supabase SQL Editor and run the following SQL commands:");
console.log("\n--- Equipment Comments Table ---");
console.log(createCommentsTableSQL);
console.log("\n--- Update Maintenance Templates Table ---");
console.log(updateMaintenanceTemplatesSQL);
