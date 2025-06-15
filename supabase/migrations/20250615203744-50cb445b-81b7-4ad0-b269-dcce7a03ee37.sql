
-- Step 1: Add new text fields for responsible persons and vehicles if they don't exist
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS responsible_persons TEXT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS vehicles TEXT;

-- Step 2: Migrate existing responsible person data to the new text field
-- This will only run if the old responsible_person_id column still exists
DO $$
BEGIN
   IF EXISTS (
      SELECT 1
      FROM   information_schema.columns
      WHERE  table_name = 'missions'
      AND    column_name = 'responsible_person_id'
   ) THEN
      UPDATE public.missions
      SET responsible_persons = (
          SELECT p.first_name || ' ' || p.last_name
          FROM public.persons p
          WHERE p.id = public.missions.responsible_person_id
      )
      WHERE responsible_person_id IS NOT NULL AND responsible_persons IS NULL;
   END IF;
END $$;


-- Step 3: Remove the foreign key constraint on the old column if it exists
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_responsible_person_id_fkey;

-- Step 4: Drop the old responsible_person_id column if it exists
ALTER TABLE public.missions DROP COLUMN IF EXISTS responsible_person_id;
