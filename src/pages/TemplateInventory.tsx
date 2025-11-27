import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useTemplateInventoryChecks, 
  useCreateInventoryCheck, 
  useUpdateInventoryCheck 
} from "@/hooks/useTemplateInventory";
import { useEquipmentTemplates } from "@/hooks/useEquipmentTemplates";
import { usePersons } from "@/hooks/usePersons";
import { useCategories } from "@/hooks/useCategories";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  PackageSearch, 
  Plus, 
  PlayCircle, 
  Trash2, 
  CheckCircle2,
  Filter 
} from "lucide-react";
import { toast } from "sonner";
import { InventoryCheckSession } from "@/components/equipment-templates/InventoryCheckSession";
import { InventoryExportButtons } from "@/components/equipment-templates/InventoryExportButtons";
import { useInventoryCheckItems } from "@/hooks/useTemplateInventory";
import { useTemplateEquipmentItems } from "@/hooks/useEquipmentTemplates";

const TemplateInventory = () => {
  const { data: checks = [] } = useTemplateInventoryChecks();
  const { data: templates = [] } = useEquipmentTemplates();
  const { data: persons = [] } = usePersons();
  const { data: categories = [] } = useCategories();
  const createCheck = useCreateInventoryCheck();
  const updateCheck = useUpdateInventoryCheck();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  
  // Filters
  const [filterPerson, setFilterPerson] = useState<string>("all_persons");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all_status");

  const handleStartInventory = async () => {
    if (!selectedTemplate || !selectedPerson) {
      toast.error("Bitte wählen Sie eine Vorlage und eine Person aus");
      return;
    }

    try {
      await createCheck.mutateAsync({
        template_id: selectedTemplate,
        checked_by: selectedPerson,
      });
      toast.success("Inventur gestartet");
      setSelectedTemplate("");
      setSelectedPerson("");
    } catch (error) {
      toast.error("Fehler beim Starten der Inventur");
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    if (!confirm("Möchten Sie diese Inventur wirklich löschen?")) return;

    try {
      await updateCheck.mutateAsync({
        id: checkId,
        status: "cancelled",
      });
      toast.success("Inventur gelöscht");
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleCompleteCheck = async (checkId: string) => {
    if (!confirm("Möchten Sie diese Inventur als abgeschlossen markieren?")) return;

    try {
      await updateCheck.mutateAsync({
        id: checkId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      toast.success("Inventur abgeschlossen");
    } catch (error) {
      toast.error("Fehler beim Abschließen");
    }
  };

  // Apply filters
  const filteredChecks = checks.filter(check => {
    if (filterPerson && filterPerson !== "all_persons" && check.checked_by !== filterPerson) {
      return false;
    }
    if (filterCategory) {
      const template = templates.find(t => t.id === check.template_id);
      // We need to check if any equipment in the template belongs to the category
      // For simplicity, we skip this filter for now as it requires more data
    }
    if (filterStatus && filterStatus !== "all_status" && check.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventur Ausrüstung</h1>
        <p className="text-muted-foreground">
          Führen Sie Inventuren für Ausrüstungsvorlagen durch
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Neue Inventur starten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vorlage</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Vorlage auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verantwortliche Person</label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Person auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleStartInventory} disabled={createCheck.isPending}>
            <PackageSearch className="mr-2 h-4 w-4" />
            Inventur starten
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventur-Historie</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            <Select value={filterPerson} onValueChange={setFilterPerson}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Person..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_persons">Alle Personen</SelectItem>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">Alle Status</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterPerson("all_persons");
                setFilterCategory("");
                setFilterStatus("all_status");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredChecks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Inventuren gefunden
              </p>
            ) : (
              filteredChecks.map((check) => (
                <InventoryCheckCard 
                  key={check.id} 
                  check={check}
                  onContinue={() => setActiveCheckId(check.id)}
                  onDelete={() => handleDeleteCheck(check.id)}
                  onComplete={() => handleCompleteCheck(check.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Session Dialog */}
      {activeCheckId && (
        <InventoryCheckSession
          checkId={activeCheckId}
          open={!!activeCheckId}
          onOpenChange={(open) => !open && setActiveCheckId(null)}
        />
      )}
    </div>
  );
};

function InventoryCheckCard({ 
  check, 
  onContinue, 
  onDelete, 
  onComplete 
}: { 
  check: any;
  onContinue: () => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const { data: checkedItems = [] } = useInventoryCheckItems(check.id);
  const { data: templateItems = [] } = useTemplateEquipmentItems(check.template_id || "");

  return (
    <div className="border p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold">{check.template?.name || "Unbekannte Vorlage"}</h3>
          <p className="text-sm text-muted-foreground">
            {check.checked_by_person?.first_name} {check.checked_by_person?.last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Gestartet: {new Date(check.started_at || "").toLocaleDateString('de-DE')}
            {check.completed_at && ` • Abgeschlossen: ${new Date(check.completed_at).toLocaleDateString('de-DE')}`}
          </p>
          {check.status === 'completed' && (
            <p className="text-xs text-muted-foreground">
              Fortschritt: {checkedItems.length} von {templateItems.length} geprüft
            </p>
          )}
          {check.notes && (
            <p className="text-xs text-muted-foreground mt-1">
              Notiz: {check.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={
              check.status === 'completed' ? 'default' :
              check.status === 'cancelled' ? 'destructive' :
              'secondary'
            }
          >
            {check.status === 'completed' ? 'Abgeschlossen' :
             check.status === 'cancelled' ? 'Abgebrochen' :
             'In Bearbeitung'}
          </Badge>
          
          {check.status === 'in_progress' && (
            <>
              <Button size="sm" variant="outline" onClick={onContinue}>
                <PlayCircle className="h-4 w-4 mr-1" />
                Fortsetzen
              </Button>
              <Button size="sm" variant="outline" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Abschließen
              </Button>
              <Button size="sm" variant="outline" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {check.status === 'completed' && (
            <InventoryExportButtons 
              checkId={check.id}
              check={check}
              checkedItems={checkedItems}
              templateItems={templateItems}
            />
          )}
          
          {check.status === 'cancelled' && (
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateInventory;
