-- Tabelle für Inventur-Sessions
CREATE TABLE IF NOT EXISTS template_inventory_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES mission_equipment_templates(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES persons(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für einzelne Inventur-Positionen
CREATE TABLE IF NOT EXISTS inventory_check_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_check_id UUID REFERENCES template_inventory_checks(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id),
  status TEXT CHECK (status IN ('present', 'missing', 'replaced')) DEFAULT 'present',
  replacement_equipment_id UUID REFERENCES equipment(id),
  notes TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies für template_inventory_checks
ALTER TABLE template_inventory_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on template_inventory_checks"
ON template_inventory_checks
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies für inventory_check_items
ALTER TABLE inventory_check_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on inventory_check_items"
ON inventory_check_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_inventory_checks_template ON template_inventory_checks(template_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_check ON inventory_check_items(inventory_check_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_equipment ON inventory_check_items(equipment_id);