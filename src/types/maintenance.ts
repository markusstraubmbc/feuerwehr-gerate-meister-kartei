
export type Equipment = {
  id: string;
  name: string;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  purchase_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
};

export type MaintenanceRecord = {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  performed_by: string | null;
  performed_at: string | null;
  due_date: string;
  notes: string | null;
};

export type InventoryItem = {
  id: string;
  item_name: string;
  item_number: string | null;
  category: string | null;
  quantity: number;
  minimum_quantity: number;
  location: string | null;
};
