import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AutoMaintenanceGenerator } from "@/components/maintenance/AutoMaintenanceGenerator";
import { CronJobMonitoring } from "@/components/settings/CronJobMonitoring";

const AutomatedMaintenanceSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Automatische Wartung</h1>
      </div>

      <div className="space-y-6">
        <AutoMaintenanceGenerator />
        <CronJobMonitoring />
      </div>
    </div>
  );
};

export default AutomatedMaintenanceSettings;
