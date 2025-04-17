
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, FileUp, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { usePersons } from "@/hooks/usePersons";
import { Input } from "@/components/ui/input";
import { MaintenanceTemplateForm } from "@/components/maintenance/MaintenanceTemplateForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MaintenanceTemplateSettings = () => {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useMaintenanceTemplates();
  const { data: persons = [] } = usePersons();
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = templates.filter(
    (template) => template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Wartungsvorlagen verwalten</h1>
        </div>
        <Button size="sm" onClick={() => setIsNewTemplateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Wartungsvorlage
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Wartungsvorlagen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Intervall (Monate)</th>
                  <th className="p-2 text-left">Kategorie</th>
                  <th className="p-2 text-left">Verantwortliche Person</th>
                  <th className="p-2 text-left">Beschreibung</th>
                  <th className="p-2 text-left">Checkliste</th>
                  <th className="p-2 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <tr key={template.id} className="border-t">
                      <td className="p-2">{template.name}</td>
                      <td className="p-2">{template.interval_months}</td>
                      <td className="p-2">
                        {template.category ? (
                          <Badge variant="outline">{template.category.name}</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">
                        {template.responsible_person ? 
                          `${template.responsible_person.first_name} ${template.responsible_person.last_name}` : 
                          "-"}
                      </td>
                      <td className="p-2 max-w-xs truncate">{template.description || "-"}</td>
                      <td className="p-2">
                        {template.checklist_url ? (
                          <Button variant="outline" size="sm" className="h-8 px-2 py-1">
                            <FileUp className="h-4 w-4 mr-1" />
                            Vorhanden
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-8 px-2 py-1">
                            <FileUp className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTemplate(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      Keine Wartungsvorlagen gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Wartungsvorlage anlegen</DialogTitle>
          </DialogHeader>
          <MaintenanceTemplateForm onSuccess={() => setIsNewTemplateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wartungsvorlage bearbeiten</DialogTitle>
          </DialogHeader>
          {editTemplate && (
            <MaintenanceTemplateForm 
              onSuccess={() => setEditTemplate(null)} 
              template={editTemplate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceTemplateSettings;
