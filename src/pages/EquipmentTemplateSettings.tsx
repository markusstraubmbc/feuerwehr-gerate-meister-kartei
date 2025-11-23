import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Package, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useEquipmentTemplates,
  useTemplateEquipmentItems,
  useCreateTemplate,
  useDeleteTemplate,
  useRemoveEquipmentFromTemplate,
} from "@/hooks/useEquipmentTemplates";
import { AddEquipmentToTemplateDialog } from "@/components/equipment-templates/AddEquipmentToTemplateDialog";
import { toast } from "sonner";

const EquipmentTemplateSettings = () => {
  const navigate = useNavigate();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateVehicle, setNewTemplateVehicle] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");

  const { data: templates = [] } = useEquipmentTemplates();
  const { data: templateItems = [] } = useTemplateEquipmentItems(selectedTemplate || "");
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const removeEquipment = useRemoveEquipmentFromTemplate();

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;

    createTemplate.mutate(
      {
        name: newTemplateName,
        vehicle_reference: newTemplateVehicle || undefined,
        description: newTemplateDescription || undefined,
      },
      {
        onSuccess: () => {
          setShowNewDialog(false);
          setNewTemplateName("");
          setNewTemplateVehicle("");
          setNewTemplateDescription("");
        },
      }
    );
  };

  const handleExport = () => {
    if (!selectedTemplate) {
      toast.error("Bitte wählen Sie eine Vorlage aus");
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const exportData = {
      template: {
        name: template.name,
        vehicle_reference: template.vehicle_reference,
        description: template.description,
      },
      items: templateItems.map(item => ({
        equipment_name: item.equipment?.name,
        notes: item.notes,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vorlage_${template.name.replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Vorlage exportiert");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Create the template
        createTemplate.mutate(
          {
            name: importData.template.name,
            vehicle_reference: importData.template.vehicle_reference,
            description: importData.template.description,
          },
          {
            onSuccess: (newTemplate) => {
              toast.success(`Vorlage "${newTemplate.name}" importiert. Bitte fügen Sie die Ausrüstungen manuell hinzu.`);
              setSelectedTemplate(newTemplate.id);
            },
          }
        );
      } catch (error) {
        console.error("Error importing template:", error);
        toast.error("Fehler beim Importieren der Vorlage");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm("Möchten Sie diese Vorlage wirklich löschen?")) return;
    if (selectedTemplate === id) setSelectedTemplate(null);
    deleteTemplate.mutate(id);
  };

  const handleRemoveEquipment = (itemId: string) => {
    if (!selectedTemplate) return;
    removeEquipment.mutate({ itemId, templateId: selectedTemplate });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Ausrüstungs-Vorlagen</h1>
      </div>

      <div className="flex justify-end gap-2">
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          id="import-template"
        />
        <Button variant="outline" onClick={() => document.getElementById('import-template')?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Importieren
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={!selectedTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vorlagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                  selectedTemplate === template.id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.vehicle_reference && (
                    <div className="text-sm text-muted-foreground">
                      Fahrzeug: {template.vehicle_reference}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ausrüstung in Vorlage</CardTitle>
              {selectedTemplate && (
                <Button size="sm" onClick={() => setShowAddEquipmentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Hinzufügen
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-2">
                {templateItems.length > 0 ? (
                  templateItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{item.equipment?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.equipment?.category?.name} • {item.equipment?.location?.name}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Notiz: {item.notes}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEquipment(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Noch keine Ausrüstung in dieser Vorlage
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Wählen Sie eine Vorlage aus
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Vorlage erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="z.B. HLF 20 Standard"
              />
            </div>
            <div>
              <Label htmlFor="template-vehicle">Fahrzeug-Referenz</Label>
              <Input
                id="template-vehicle"
                value={newTemplateVehicle}
                onChange={(e) => setNewTemplateVehicle(e.target.value)}
                placeholder="z.B. HLF 20, DLK 23/12"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Beschreibung</Label>
              <Textarea
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Optionale Beschreibung"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateTemplate}>Erstellen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedTemplate && (
        <AddEquipmentToTemplateDialog
          open={showAddEquipmentDialog}
          onOpenChange={setShowAddEquipmentDialog}
          templateId={selectedTemplate}
          templateName={templates.find(t => t.id === selectedTemplate)?.name || ""}
        />
      )}
    </div>
  );
};

export default EquipmentTemplateSettings;
