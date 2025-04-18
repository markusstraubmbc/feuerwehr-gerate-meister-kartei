
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
