import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTemplateInventoryChecks, useCreateInventoryCheck } from "@/hooks/useTemplateInventory";
import { useEquipmentTemplates } from "@/hooks/useEquipmentTemplates";
import { usePersons } from "@/hooks/usePersons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackageSearch, Plus, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { InventoryCheckSession } from "@/components/equipment-templates/InventoryCheckSession";

const TemplateInventory = () => {
  const { data: checks = [] } = useTemplateInventoryChecks();
  const { data: templates = [] } = useEquipmentTemplates();
  const { data: persons = [] } = usePersons();
  const createCheck = useCreateInventoryCheck();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ausrüstungsvorlagen Inventur</h1>
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
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Inventuren durchgeführt
              </p>
            ) : (
              checks.map((check) => (
                <div key={check.id} className="border p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{check.template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {check.checked_by_person?.first_name} {check.checked_by_person?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gestartet: {new Date(check.started_at || "").toLocaleDateString('de-DE')}
                        {check.completed_at && ` • Abgeschlossen: ${new Date(check.completed_at).toLocaleDateString('de-DE')}`}
                      </p>
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
                        <Button 
                          size="sm" 
                          onClick={() => setActiveCheckId(check.id)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Fortsetzen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
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

export default TemplateInventory;
