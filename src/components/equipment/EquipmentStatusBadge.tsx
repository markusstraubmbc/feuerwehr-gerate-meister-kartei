
import { CheckCircle, Package, AlertTriangle } from "lucide-react";

interface EquipmentStatusBadgeProps {
  status: "einsatzbereit" | "wartung" | "defekt" | "prüfung fällig";
}

export function EquipmentStatusBadge({ status }: EquipmentStatusBadgeProps) {
  const styles = {
    einsatzbereit: "bg-green-100 text-green-800 border-green-200",
    wartung: "bg-blue-100 text-blue-800 border-blue-200",
    defekt: "bg-red-100 text-red-800 border-red-200",
    "prüfung fällig": "bg-amber-100 text-amber-800 border-amber-200",
  };

  const getStatusIndicator = () => {
    switch (status) {
      case "einsatzbereit":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "wartung":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "defekt":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "prüfung fällig":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="flex items-center">
      {getStatusIndicator()}
      <span className={`ml-2 px-2 py-1 text-xs rounded-md border ${styles[status]}`}>
        {status}
      </span>
    </div>
  );
}
