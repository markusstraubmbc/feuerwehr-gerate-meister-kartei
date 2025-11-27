import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useInventoryCheckItems, 
  useCreateInventoryCheckItem, 
  useUpdateInventoryCheck,
  useTemplateInventoryChecks 
} from "@/hooks/useTemplateInventory";
import { useTemplateEquipmentItems, useRemoveEquipmentFromTemplate } from "@/hooks/useEquipmentTemplates";
import { useEquipment } from "@/hooks/useEquipment";
import { useEquipmentComments } from "@/hooks/useEquipmentComments";
import { CheckCircle2, XCircle, RefreshCw, ChevronRight, ChevronLeft, ScanLine, MessageSquare, Scan } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { QRScanner } from "@/components/equipment/QRScanner";
import { ReplacementEquipmentDialog } from "./ReplacementEquipmentDialog";
import { AddMissingItemsDialog } from "./AddMissingItemsDialog";
import { InventoryScanMode } from "./InventoryScanMode";
import { InventoryCompletionReport } from "./InventoryCompletionReport";

interface InventoryCheckSessionProps {
  checkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryCheckSession({ checkId, open, onOpenChange }: InventoryCheckSessionProps) {
  const { data: checks = [] } = useTemplateInventoryChecks();
  const check = checks.find(c => c.id === checkId);
  const { data: templateItems = [] } = useTemplateEquipmentItems(check?.template_id || "");
  const { data: checkedItems = [] } = useInventoryCheckItems(checkId);
  const { data: allEquipment = [] } = useEquipment();
  const createItem = useCreateInventoryCheckItem();
  const updateCheck = useUpdateInventoryCheck();
  const removeEquipmentFromTemplate = useRemoveEquipmentFromTemplate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"present" | "missing" | "replaced">("present");
  const [replacementId, setReplacementId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [missingItemsDialogOpen, setMissingItemsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"normal" | "scan">("normal");
  const [completionReportOpen, setCompletionReportOpen] = useState(false);

  const currentItem = templateItems[currentIndex];
  const { data: comments = [] } = useEquipmentComments(currentItem?.equipment_id || "");
  const progress = (checkedItems.length / templateItems.length) * 100;
  const isLastItem = currentIndex === templateItems.length - 1;

  // Check if current item is already checked
  const existingCheck = checkedItems.find(item => item.equipment_id === currentItem?.equipment_id);

  useEffect(() => {
    if (existingCheck) {
      setStatus(existingCheck.status as any);
      setReplacementId(existingCheck.replacement_equipment_id || "");
      setNotes(existingCheck.notes || "");
    } else {
      setStatus("present");
      setReplacementId("");
      setNotes("");
    }
  }, [currentIndex, existingCheck]);

  const handleCheckItem = async () => {
    if (!currentItem) return;

    try {
      await createItem.mutateAsync({
        inventory_check_id: checkId,
        equipment_id: currentItem.equipment_id,
        status,
        replacement_equipment_id: status === "replaced" ? replacementId : undefined,
        notes: notes || undefined,
      });

      // If item is marked as missing, remove it from the template
      if (status === "missing" && check?.template_id) {
        const itemToRemove = templateItems.find(item => item.equipment_id === currentItem.equipment_id);
        if (itemToRemove) {
          await removeEquipmentFromTemplate.mutateAsync({ 
            itemId: itemToRemove.id, 
            templateId: check.template_id 
          });
          toast.success("Position geprüft und aus Vorlage entfernt");
        } else {
          toast.success("Position geprüft");
        }
      } else if (status === "replaced" && check?.template_id && replacementId) {
        // Remove old equipment from template
        const itemToRemove = templateItems.find(item => item.equipment_id === currentItem.equipment_id);
        if (itemToRemove) {
          await removeEquipmentFromTemplate.mutateAsync({ 
            itemId: itemToRemove.id, 
            templateId: check.template_id 
          });
        }
        toast.success("Position geprüft");
      } else {
        toast.success("Position geprüft");
      }

      // Move to next item or complete
      if (isLastItem) {
        // Show dialog to add missing items
        setMissingItemsDialogOpen(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Fehler beim Prüfen");
    }
  };

  const handleCompleteInventory = async () => {
    try {
      await updateCheck.mutateAsync({
        id: checkId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      toast.success("Inventur abgeschlossen!");
      setCompletionReportOpen(true);
    } catch (error) {
      toast.error("Fehler beim Abschließen");
    }
  };

  const handleScan = (barcode: string) => {
    // Check if current item matches scanned barcode
    if (currentItem.equipment?.barcode === barcode) {
      // Auto-advance with "present" status
      setStatus("present");
      setScannerOpen(false);
      
      // Automatically check item after small delay
      setTimeout(() => {
        handleCheckItem();
      }, 300);
    } else {
      toast.error("Barcode stimmt nicht mit aktueller Position überein");
    }
  };

  const handleReplacementSelected = (equipmentId: string) => {
    setReplacementId(equipmentId);
    setReplacementDialogOpen(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (!isLastItem) {
      setCurrentIndex(prev => prev + 1);
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

  if (!check || !currentItem) {
    return null;
  }

  const availableReplacements = allEquipment.filter(eq => 
    eq.id !== currentItem.equipment_id &&
    eq.status === "einsatzbereit"
  );

  // If scan mode is active, render the scan mode component
  if (mode === "scan") {
    return (
      <>
        <InventoryScanMode
          checkId={checkId}
          open={open}
          onOpenChange={onOpenChange}
          onComplete={() => setCompletionReportOpen(true)}
        />
        <InventoryCompletionReport
          open={completionReportOpen}
          onOpenChange={(open) => {
            setCompletionReportOpen(open);
            if (!open) {
              onOpenChange(false);
            }
          }}
          check={check}
          checkedItems={checkedItems}
          templateItems={templateItems}
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Inventur: {check.template.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode("scan")}
            >
              <Scan className="h-4 w-4 mr-2" />
              Scan-Modus
            </Button>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Prüfung von {check.checked_by_person?.first_name} {check.checked_by_person?.last_name}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Fortschritt</span>
              <span>{checkedItems.length} von {templateItems.length} geprüft</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Current item */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{currentItem.equipment?.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentItem.equipment?.inventory_number && (
                    <Badge variant="secondary" className="font-mono">
                      Inv.-Nr.: {currentItem.equipment.inventory_number}
                    </Badge>
                  )}
                  {currentItem.equipment?.barcode && (
                    <Badge variant="secondary" className="font-mono">
                      Barcode: {currentItem.equipment.barcode}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
                <Badge variant="outline">
                  {currentIndex + 1} / {templateItems.length}
                </Badge>
              </div>
            </div>
            {currentItem.equipment?.category && (
              <p className="text-sm text-muted-foreground">
                Kategorie: {currentItem.equipment.category.name}
              </p>
            )}
            {currentItem.equipment?.location && (
              <p className="text-sm text-muted-foreground">
                Standort: {currentItem.equipment.location.name}
              </p>
            )}
            {currentItem.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                Hinweis: {currentItem.notes}
              </p>
            )}
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                <h4 className="font-semibold text-sm">Kommentare ({comments.length})</h4>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-muted-foreground">{comment.comment}</p>
                          {comment.action && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {comment.action.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comment.person.first_name} {comment.person.last_name} • {format(new Date(comment.created_at), "dd.MM.yyyy", { locale: de })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Status selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Status</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={status === "present" ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setStatus("present")}
              >
                <CheckCircle2 className="h-6 w-6 mb-1" />
                <span className="text-xs">Vorhanden</span>
              </Button>
              <Button
                variant={status === "missing" ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setStatus("missing")}
              >
                <XCircle className="h-6 w-6 mb-1" />
                <span className="text-xs">Fehlt</span>
              </Button>
              <Button
                variant={status === "replaced" ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setStatus("replaced")}
              >
                <RefreshCw className="h-6 w-6 mb-1" />
                <span className="text-xs">Ersetzt</span>
              </Button>
            </div>
          </div>

          {/* Replacement selection */}
          {status === "replaced" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Ersetzt durch</label>
              <div className="flex gap-2">
                <Select value={replacementId} onValueChange={setReplacementId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ersatzausrüstung wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReplacements.slice(0, 5).map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} {eq.inventory_number && `(${eq.inventory_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setReplacementDialogOpen(true)}
                >
                  Suchen
                </Button>
              </div>
              {replacementId && (
                <p className="text-sm text-muted-foreground">
                  Ausgewählt: {availableReplacements.find(eq => eq.id === replacementId)?.name}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notizen (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Bemerkungen..."
              rows={3}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLastItem}
              >
                Überspringen
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleCheckItem}
                disabled={status === "replaced" && !replacementId}
              >
                {isLastItem ? "Abschließen" : (
                  <>
                    Weiter
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Scanner Dialog */}
        <QRScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleScan}
        />

        {/* Replacement Equipment Dialog */}
        <ReplacementEquipmentDialog
          open={replacementDialogOpen}
          onOpenChange={setReplacementDialogOpen}
          onSelect={handleReplacementSelected}
          currentEquipmentId={currentItem?.equipment_id}
        />

        {/* Add Missing Items Dialog */}
        <AddMissingItemsDialog
          open={missingItemsDialogOpen}
          onOpenChange={setMissingItemsDialogOpen}
          checkId={checkId}
          templateId={check?.template_id || ""}
          templateItems={templateItems}
          checkedItems={checkedItems}
          onComplete={handleCompleteInventory}
        />
      </DialogContent>

      <InventoryCompletionReport
        open={completionReportOpen}
        onOpenChange={(open) => {
          setCompletionReportOpen(open);
          if (!open) {
            onOpenChange(false);
          }
        }}
        check={check}
        checkedItems={checkedItems}
        templateItems={templateItems}
      />
    </Dialog>
  );
}
