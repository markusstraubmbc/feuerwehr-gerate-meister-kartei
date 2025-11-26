-- Add responsible_person_id to categories table
ALTER TABLE public.categories 
ADD COLUMN responsible_person_id uuid REFERENCES public.persons(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_categories_responsible_person ON public.categories(responsible_person_id);