-- Add notification_interval_days to categories table for category-specific intervals
ALTER TABLE public.categories 
ADD COLUMN notification_interval_days INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.categories.notification_interval_days IS 'Category-specific notification interval in days. If NULL, uses global default.';

-- Create index for better performance
CREATE INDEX idx_categories_notification_interval ON public.categories(notification_interval_days);

-- Add cascade delete for maintenance records when equipment is deleted
-- This ensures that when completing one maintenance and deleting others, relationships stay clean
ALTER TABLE public.maintenance_records 
DROP CONSTRAINT IF EXISTS maintenance_records_equipment_id_fkey;

ALTER TABLE public.maintenance_records
ADD CONSTRAINT maintenance_records_equipment_id_fkey 
FOREIGN KEY (equipment_id) 
REFERENCES public.equipment(id) 
ON DELETE CASCADE;