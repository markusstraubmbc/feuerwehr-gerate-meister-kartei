
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MaintenanceRecord, generateCustomChecklist } from "@/hooks/useMaintenanceRecords";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ViewMaintenanceDialogProps {
  record: MaintenanceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewMaintenanceDialog({
  record,
  open,
  onOpenChange,
}: ViewMaintenanceDialogProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const handleDownloadCustomChecklist = async () => {
    setIsGeneratingPdf(true);
    try {
      console.log("Generating custom checklist for record:", record.id);
      const blob = await generateCustomChecklist(record);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wartung-checkliste-${record.equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}-${format(new Date(record.due_date), 'yyyy-MM-dd')}.html`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        toast.success("Checkliste wurde erfolgreich heruntergeladen");
      } else {
        console.error("No blob generated");
        toast.error("Fehler beim Generieren der Checkliste");
      }
    } catch (error) {
      console.error("Error generating checklist:", error);
      toast.error("Fehler beim Herunterladen der Checkliste");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Wartungsdetails</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ausrüstung</p>
              <p className="font-medium">{record.equipment.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <MaintenanceStatusBadge status={record.status} />
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Wartungstyp</p>
              <p className="font-medium">{record.template?.name || "Keine Vorlage"}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Fällig am</p>
              <p className="font-medium">
                {format(new Date(record.due_date), "dd.MM.yyyy", { locale: de })}
              </p>
            </div>
            
            {record.performed_date && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Durchgeführt am</p>
                  <p className="font-medium">
                    {format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Durchgeführt von</p>
                  <p className="font-medium">
                    {record.performer ? 
                      `${record.performer.first_name} ${record.performer.last_name}` : 
                      "Nicht zugewiesen"}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {record.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Anmerkungen</p>
              <p className="text-sm">{record.notes}</p>
            </div>
          )}
          
          {record.documentation_image_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Dokumentationsbild</p>
              <img 
                src={record.documentation_image_url}
                alt="Wartungsdokumentation" 
                className="w-full rounded-md h-auto max-h-60 object-contain border"
              />
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Checkliste</h4>
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleDownloadCustomChecklist}
                disabled={isGeneratingPdf}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isGeneratingPdf ? "Generiere..." : "Standard-Checkliste herunterladen"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
