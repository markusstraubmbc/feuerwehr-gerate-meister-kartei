
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Wrench, AlertCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MaintenanceStatus = Database["public"]["Enums"]["maintenance_status"];

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
}

const statusConfig: Record<MaintenanceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  "ausstehend": {
    label: "Ausstehend",
    variant: "default",
    icon: <Clock className="h-4 w-4" />,
  },
  "geplant": {
    label: "Geplant",
    variant: "secondary",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  "in_bearbeitung": {
    label: "In Bearbeitung",
    variant: "outline",
    icon: <Wrench className="h-4 w-4" />,
  },
  "abgeschlossen": {
    label: "Abgeschlossen",
    variant: "default",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

export const MaintenanceStatusBadge = ({ status }: MaintenanceStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};
