import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  useInventoryCheckItems, 
  useCreateInventoryCheckItem, 
  useUpdateInventoryCheck,
  useTemplateInventoryChecks 
} from "@/hooks/useTemplateInventory";
import { useTemplateEquipmentItems, useRemoveEquipmentFromTemplate } from "@/hooks/useEquipmentTemplates";
import { CheckCircle2, XCircle, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import { QRScanner } from "@/components/equipment/QRScanner";
import { cn } from "@/lib/utils";

interface InventoryScanModeProps {
  checkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryScanMode({ checkId, open, onOpenChange }: InventoryScanModeProps) {
  const { data: checks = [] } = useTemplateInventoryChecks();
  const check = checks.find(c => c.id === checkId);
  const { data: templateItems = [] } = useTemplateEquipmentItems(check?.template_id || "");
  const { data: checkedItems = [] } = useInventoryCheckItems(checkId);
  const createItem = useCreateInventoryCheckItem();
  const updateCheck = useUpdateInventoryCheck();
  const removeEquipmentFromTemplate = useRemoveEquipmentFromTemplate();

  const [scannerOpen, setScannerOpen] = useState(true);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // Get IDs of items already marked as present
  const scannedEquipmentIds = new Set(
    checkedItems
      .filter(item => item.status === "present")
      .map(item => item.equipment_id)
  );

  const scannedCount = scannedEquipmentIds.size;
  const totalCount = templateItems.length;
  const progress = (scannedCount / totalCount) * 100;
  const unscannedCount = totalCount - scannedCount;

  const handleScan = async (barcode: string) => {
    // Find equipment with this barcode in the template
    const matchingItem = templateItems.find(
      item => item.equipment?.barcode === barcode
    );

    if (!matchingItem) {
      toast.error("Gerät nicht in dieser Vorlage gefunden");
      return;
    }

    // Check if already scanned
    if (scannedEquipmentIds.has(matchingItem.equipment_id)) {
      toast.info(`${matchingItem.equipment?.name} bereits erfasst`);
      return;
    }

    // Mark as present
    try {
      await createItem.mutateAsync({
        inventory_check_id: checkId,
        equipment_id: matchingItem.equipment_id,
        status: "present",
      });
      
      toast.success(`✓ ${matchingItem.equipment?.name} erfasst`);
    } catch (error) {
      toast.error("Fehler beim Erfassen");
    }
  };

  const handleCompleteClick = () => {
    if (unscannedCount > 0) {
      setIsCompleteDialogOpen(true);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      // Remove all unscanned items from template
      if (check?.template_id) {
        const unscannedItems = templateItems.filter(
          item => !scannedEquipmentIds.has(item.equipment_id)
        );

        for (const item of unscannedItems) {
          await createItem.mutateAsync({
            inventory_check_id: checkId,
            equipment_id: item.equipment_id,
            status: "missing",
            notes: "Nicht gescannt im Scan-Modus",
          });

          await removeEquipmentFromTemplate.mutateAsync({
            itemId: item.id,
            templateId: check.template_id,
          });
        }
      }

      // Mark inventory as completed
      await updateCheck.mutateAsync({
        id: checkId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      toast.success("Inventur abgeschlossen!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Fehler beim Abschließen");
    }
  };

  const handleCancel = async () => {
    try {
      await updateCheck.mutateAsync({
        id: checkId,
        status: "cancelled",
      });
      toast.info("Inventur abgebrochen");
      onOpenChange(false);
    } catch (error) {
      toast.error("Fehler beim Abbrechen");
    }
  };

  if (!check) return null;

  // Separate scanned and unscanned items
  const scannedItems = templateItems.filter(item => 
    scannedEquipmentIds.has(item.equipment_id)
  );
  const unscannedItems = templateItems.filter(item => 
    !scannedEquipmentIds.has(item.equipment_id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Scan-Modus: {check.template.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Scannen Sie alle vorhandenen Geräte. Nicht gescannte Geräte werden automatisch aus der Vorlage entfernt.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Fortschritt</span>
                <span className="text-muted-foreground">
                  {scannedCount} von {totalCount} erfasst
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {unscannedCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {unscannedCount} Gerät{unscannedCount !== 1 ? 'e' : ''} noch nicht erfasst
                </p>
              )}
            </div>

            {/* Scanner */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <ScanLine className="h-4 w-4" />
                  Scanner
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScannerOpen(true)}
                >
                  Scanner öffnen
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Scannen Sie die Barcodes der vorhandenen Geräte
              </p>
            </div>

            {/* Equipment Lists */}
            <div className="grid grid-cols-2 gap-4">
              {/* Scanned Items */}
              <div className="border rounded-lg">
                <div className="bg-green-50 dark:bg-green-950/20 p-3 border-b">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Erfasst ({scannedCount})
                  </h4>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {scannedItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Noch keine Geräte erfasst
                      </p>
                    ) : (
                      scannedItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "p-2 rounded border bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.equipment?.name}
                              </p>
                              {item.equipment?.inventory_number && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {item.equipment.inventory_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Unscanned Items */}
              <div className="border rounded-lg">
                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 border-b">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <XCircle className="h-4 w-4" />
                    Noch nicht erfasst ({unscannedCount})
                  </h4>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {unscannedItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Alle Geräte erfasst ✓
                      </p>
                    ) : (
                      unscannedItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "p-2 rounded border bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.equipment?.name}
                              </p>
                              {item.equipment?.barcode ? (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {item.equipment.barcode}
                                </p>
                              ) : (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Kein Barcode
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleCompleteClick}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Inventur abschließen
              </Button>
            </div>
          </div>

          {/* Scanner Dialog */}
          <QRScanner
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            onScan={handleScan}
          />
        </DialogContent>
      </Dialog>

      {/* Completion Confirmation Dialog */}
      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inventur abschließen?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Sie haben {scannedCount} von {totalCount} Geräten erfasst.
              </p>
              {unscannedCount > 0 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded">
                  <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    ⚠️ {unscannedCount} nicht erfasste Geräte werden aus der Vorlage entfernt:
                  </p>
                  <ul className="text-sm space-y-1 text-orange-800 dark:text-orange-200">
                    {unscannedItems.slice(0, 5).map((item) => (
                      <li key={item.id}>• {item.equipment?.name}</li>
                    ))}
                    {unscannedCount > 5 && (
                      <li>• ... und {unscannedCount - 5} weitere</li>
                    )}
                  </ul>
                </div>
              )}
              <p className="text-sm">
                Möchten Sie die Inventur wirklich abschließen?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zurück zum Scannen</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Ja, abschließen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
