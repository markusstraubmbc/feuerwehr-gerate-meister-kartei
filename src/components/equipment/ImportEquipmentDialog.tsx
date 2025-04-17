
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, AlertCircle, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from 'papaparse';

interface ImportEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportEquipmentDialog({
  open,
  onOpenChange,
}: ImportEquipmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  
  const downloadTemplate = () => {
    const csvContent = "name,inventory_number,barcode,serial_number,manufacturer,model,category_id,location_id,responsible_person_id,status,last_check_date,next_check_date,purchase_date,replacement_date,notes\nBeispiel Ausrüstung,INV001,BC001,SN001,Hersteller,Modell,,,,einsatzbereit,2023-01-01,2024-01-01,2022-01-01,2025-01-01,Notizen";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'equipment_import_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError("Bitte wählen Sie eine CSV-Datei aus.");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      
      // Preview the file
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        complete: function(results) {
          setImportPreview(results.data);
          setError(null);
        },
        error: function(error) {
          setError(`Fehler beim Parsen der CSV-Datei: ${error}`);
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Bitte wählen Sie eine CSV-Datei aus.");
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      Papa.parse(file, {
        header: true,
        complete: async function(results) {
          const data = results.data;
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Keine gültigen Daten in der CSV-Datei gefunden.");
          }
          
          // Clean and validate data
          const equipmentData = data.filter(item => item.name).map(item => ({
            name: item.name,
            inventory_number: item.inventory_number || null,
            barcode: item.barcode || null,
            serial_number: item.serial_number || null,
            manufacturer: item.manufacturer || null,
            model: item.model || null,
            category_id: item.category_id || null,
            location_id: item.location_id || null,
            responsible_person_id: item.responsible_person_id || null,
            status: item.status || "einsatzbereit",
            last_check_date: item.last_check_date || null,
            next_check_date: item.next_check_date || null,
            purchase_date: item.purchase_date || null,
            replacement_date: item.replacement_date || null,
            notes: item.notes || null,
          }));
          
          if (equipmentData.length === 0) {
            throw new Error("Keine gültigen Ausrüstungsdaten gefunden. Stellen Sie sicher, dass mindestens das Feld 'name' vorhanden ist.");
          }
          
          // Insert data in batches
          const batchSize = 20;
          let imported = 0;
          
          for (let i = 0; i < equipmentData.length; i += batchSize) {
            const batch = equipmentData.slice(i, i + batchSize);
            
            const { error } = await supabase
              .from("equipment")
              .insert(batch);
              
            if (error) throw error;
            
            imported += batch.length;
            setProgress(Math.round((imported / equipmentData.length) * 100));
          }
          
          toast({
            title: "Import erfolgreich",
            description: `${imported} Ausrüstungsgegenstände wurden erfolgreich importiert.`,
          });
          
          queryClient.invalidateQueries({ queryKey: ["equipment"] });
          onOpenChange(false);
        },
        error: function(error) {
          throw new Error(`Fehler beim Parsen der CSV-Datei: ${error}`);
        }
      });
    } catch (err: any) {
      setError(`Fehler beim Import: ${err.message}`);
      toast({
        variant: "destructive",
        title: "Import fehlgeschlagen",
        description: err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setFile(null);
        setError(null);
        setImportPreview([]);
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ausrüstung importieren</DialogTitle>
          <DialogDescription>
            Importieren Sie mehrere Ausrüstungsgegenstände über eine CSV-Datei.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={downloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV-Vorlage herunterladen
          </Button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  CSV-Datei auswählen
                </Button>
              </div>
            </div>
            
            {file && (
              <p className="text-sm text-muted-foreground">
                Ausgewählte Datei: {file.name}
              </p>
            )}
          </div>
          
          {importPreview.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Vorschau</h4>
              <div className="border rounded-md overflow-auto max-h-56">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {Object.keys(importPreview[0]).slice(0, 5).map((header, i) => (
                        <th key={i} className="p-2 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).slice(0, 5).map((value: any, j) => (
                          <td key={j} className="p-2">{value || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Zeigt die ersten 5 Zeilen und 5 Spalten der CSV-Datei.
              </p>
            </div>
          )}
          
          {isLoading && progress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center">{progress}% abgeschlossen</p>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importiere...
              </>
            ) : "Importieren"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
