import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTemplateInventoryChecks, useCreateInventoryCheck } from "@/hooks/useTemplateInventory";
import { useEquipmentTemplates } from "@/hooks/useEquipmentTemplates";
import { usePersons } from "@/hooks/usePersons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackageSearch, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TemplateInventory = () => {
  const navigate = useNavigate();
  const { data: checks = [] } = useTemplateInventoryChecks();
  const { data: templates = [] } = useEquipmentTemplates();
  const { data: persons = [] } = usePersons();
  const createCheck = useCreateInventoryCheck();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<string>("");

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
            {checks.map((check) => (
              <div key={check.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{check.template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {check.checked_by_person?.first_name} {check.checked_by_person?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(check.started_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    check.status === 'completed' ? 'bg-green-100 text-green-800' :
                    check.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateInventory;
