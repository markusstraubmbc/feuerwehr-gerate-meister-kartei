import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useTemplateEquipmentItems, useRemoveEquipmentFromTemplate, useAddEquipmentToTemplate } from "@/hooks/useEquipmentTemplates";
import { useEquipment } from "@/hooks/useEquipment";
import { CheckCircle2, XCircle, ScanLine, X, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface InventoryScanModeProps {
  checkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface RecentScan {
  equipmentId: string;
  equipmentName: string;
  timestamp: Date;
  wasNew: boolean;
}

export function InventoryScanMode({ checkId, open, onOpenChange, onComplete }: InventoryScanModeProps) {
  const { data: checks = [] } = useTemplateInventoryChecks();
  const check = checks.find(c => c.id === checkId);
  const { data: templateItems = [] } = useTemplateEquipmentItems(check?.template_id || "");
  const { data: checkedItems = [] } = useInventoryCheckItems(checkId);
  const { data: allEquipment = [] } = useEquipment();
  const createItem = useCreateInventoryCheckItem();
  const updateCheck = useUpdateInventoryCheck();
  const removeEquipmentFromTemplate = useRemoveEquipmentFromTemplate();
  const addEquipmentToTemplate = useAddEquipmentToTemplate();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoScanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
      if (autoScanTimeoutRef.current) {
        clearTimeout(autoScanTimeoutRef.current);
      }
    };
  }, []);

  // Play success beep
  const playSuccessBeep = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  // Play error beep
  const playErrorBeep = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 300;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

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
    if (!barcode.trim()) return;

    const trimmedBarcode = barcode.trim();

    // First, check if it's in the template
    const matchingTemplateItem = templateItems.find(
      item => item.equipment?.barcode === trimmedBarcode
    );

    if (matchingTemplateItem) {
      // Check if already scanned
      if (scannedEquipmentIds.has(matchingTemplateItem.equipment_id)) {
        toast.info(`${matchingTemplateItem.equipment?.name} bereits erfasst`);
        playErrorBeep();
        setBarcodeInput("");
        inputRef.current?.focus();
        return;
      }

      // Mark as present
      try {
        await createItem.mutateAsync({
          inventory_check_id: checkId,
          equipment_id: matchingTemplateItem.equipment_id,
          status: "present",
        });
        
        playSuccessBeep();
        toast.success(`✓ ${matchingTemplateItem.equipment?.name} erfasst`);
        
        // Add to recent scans
        setRecentScans(prev => [
          {
            equipmentId: matchingTemplateItem.equipment_id,
            equipmentName: matchingTemplateItem.equipment?.name || "Unbekannt",
            timestamp: new Date(),
            wasNew: false,
          },
          ...prev.slice(0, 4)
        ]);
        
        setBarcodeInput("");
        inputRef.current?.focus();
      } catch (error) {
        playErrorBeep();
        toast.error("Fehler beim Erfassen");
        setBarcodeInput("");
        inputRef.current?.focus();
      }
      return;
    }

    // If not in template, check if it exists in all equipment
    const matchingEquipment = allEquipment.find(
      eq => eq.barcode === trimmedBarcode
    );

    if (!matchingEquipment) {
      playErrorBeep();
      toast.error("Gerät mit diesem Barcode nicht gefunden");
      setBarcodeInput("");
      inputRef.current?.focus();
      return;
    }

    // Check if already in checked items (might have been added as new equipment)
    const alreadyChecked = checkedItems.find(
      item => item.equipment_id === matchingEquipment.id
    );

    if (alreadyChecked) {
      toast.info(`${matchingEquipment.name} bereits erfasst`);
      playErrorBeep();
      setBarcodeInput("");
      inputRef.current?.focus();
      return;
    }

    // Equipment exists but not in template - add it
    try {
      // Add to template first
      if (check?.template_id) {
        await addEquipmentToTemplate.mutateAsync({
          template_id: check.template_id,
          equipment_id: matchingEquipment.id,
        });
      }

      // Then mark as present in inventory check
      await createItem.mutateAsync({
        inventory_check_id: checkId,
        equipment_id: matchingEquipment.id,
        status: "present",
        notes: "Neu hinzugefügt während Inventur",
      });

      playSuccessBeep();
      toast.success(`✓ ${matchingEquipment.name} hinzugefügt und erfasst`);
      
      // Add to recent scans
      setRecentScans(prev => [
        {
          equipmentId: matchingEquipment.id,
          equipmentName: matchingEquipment.name,
          timestamp: new Date(),
          wasNew: true,
        },
        ...prev.slice(0, 4)
      ]);
      
      setBarcodeInput("");
      inputRef.current?.focus();
    } catch (error) {
      playErrorBeep();
      toast.error("Fehler beim Hinzufügen");
      setBarcodeInput("");
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (autoScanTimeoutRef.current) {
        clearTimeout(autoScanTimeoutRef.current);
      }
      handleScan(barcodeInput);
    }
  };

  // Auto-scan when barcode is detected
  const handleBarcodeChange = (value: string) => {
    setBarcodeInput(value);
    
    // Clear existing timeout
    if (autoScanTimeoutRef.current) {
      clearTimeout(autoScanTimeoutRef.current);
    }

    // Set new timeout for auto-scan (300ms after last input)
    if (value.trim().length >= 3) { // Minimum barcode length
      autoScanTimeoutRef.current = setTimeout(() => {
        handleScan(value);
      }, 300);
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
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
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

            {/* Recent Scan - Only show the last one */}
            {recentScans.length > 0 && (
              <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-700 dark:text-green-400" />
                  <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">
                    Zuletzt erfasst
                  </h4>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="truncate font-medium text-sm">{recentScans[0].equipmentName}</span>
                      {recentScans[0].wasNew && (
                        <Badge variant="secondary" className="text-xs">
                          <Plus className="h-2 w-2 mr-1" />
                          Neu
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(recentScans[0].timestamp, "HH:mm:ss", { locale: de })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scanner Input */}
            <div className="border rounded-lg p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <ScanLine className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Barcode scannen</h3>
              </div>
              <div className="space-y-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => handleBarcodeChange(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Barcode hier scannen oder eingeben..."
                  className="text-lg font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Scanner fügt Barcode automatisch ein und verarbeitet nach 0,3 Sekunden.
                </p>
              </div>
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
