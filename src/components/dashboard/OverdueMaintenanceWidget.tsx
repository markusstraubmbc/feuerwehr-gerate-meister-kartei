import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Wrench, CheckCircle, Filter } from "lucide-react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";

export function OverdueMaintenanceWidget() {
  const navigate = useNavigate();
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const { data: categories = [] } = useCategories();
  const { data: templates = [] } = useMaintenanceTemplates();
  
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter and categorize maintenance records
  const filteredRecords = maintenanceRecords.filter(record => {
    if (categoryFilter !== "all" && record.equipment?.category_id !== categoryFilter) {
      return false;
    }
    if (templateFilter !== "all" && record.template_id !== templateFilter) {
      return false;
    }
    if (statusFilter !== "all") {
      const dueDate = new Date(record.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate < today && record.status !== "abgeschlossen";
      const isDueSoon = dueDate >= today && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && record.status !== "abgeschlossen";
      
      if (statusFilter === "overdue" && !isOverdue) return false;
      if (statusFilter === "due_soon" && !isDueSoon) return false;
      if (statusFilter === "completed" && record.status !== "abgeschlossen") return false;
    }
    return true;
  });

  const overdueRecords = filteredRecords.filter(record => {
    const dueDate = new Date(record.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && record.status !== "abgeschlossen";
  });

  const dueSoonRecords = filteredRecords.filter(record => {
    const dueDate = new Date(record.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= sevenDaysFromNow && record.status !== "abgeschlossen";
  });

  const equipmentIssues = filteredRecords.filter(record => 
    record.equipment?.status === "defekt" || record.equipment?.status === "wartung"
  );

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Wartungsübersicht & Ausrüstungsprobleme
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/maintenance")}>
            Alle anzeigen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-2 md:grid-cols-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="overdue">Überfällig</SelectItem>
              <SelectItem value="due_soon">Bald fällig</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Kategorie..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Wartungstyp..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Wartungstypen</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setCategoryFilter("all");
              setTemplateFilter("all");
              setStatusFilter("all");
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Überfällige Wartungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueRecords.length}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-orange-600" />
                Bald fällig (7 Tage)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dueSoonRecords.length}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Ausrüstungsprobleme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{equipmentIssues.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {overdueRecords.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-red-600">Überfällig</h4>
              {overdueRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-red-50 mb-2"
                >
                  <div className="flex-1">
                    <div className="font-medium">{record.equipment?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.template?.name} • Fällig: {format(new Date(record.due_date), "dd.MM.yyyy", { locale: de })}
                    </div>
                  </div>
                  <Badge variant="destructive">Überfällig</Badge>
                </div>
              ))}
              {overdueRecords.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... und {overdueRecords.length - 5} weitere
                </p>
              )}
            </div>
          )}

          {dueSoonRecords.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-orange-600">Bald fällig</h4>
              {dueSoonRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-orange-50 mb-2"
                >
                  <div className="flex-1">
                    <div className="font-medium">{record.equipment?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.template?.name} • Fällig: {format(new Date(record.due_date), "dd.MM.yyyy", { locale: de })}
                    </div>
                  </div>
                  <Badge className="bg-orange-500">Bald fällig</Badge>
                </div>
              ))}
              {dueSoonRecords.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... und {dueSoonRecords.length - 5} weitere
                </p>
              )}
            </div>
          )}

          {equipmentIssues.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-yellow-600">Ausrüstungsprobleme</h4>
              {equipmentIssues.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-yellow-50 mb-2"
                >
                  <div className="flex-1">
                    <div className="font-medium">{record.equipment?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {record.equipment?.status}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                    {record.equipment?.status}
                  </Badge>
                </div>
              ))}
              {equipmentIssues.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... und {equipmentIssues.length - 5} weitere
                </p>
              )}
            </div>
          )}

          {overdueRecords.length === 0 && dueSoonRecords.length === 0 && equipmentIssues.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>Keine dringenden Wartungen oder Probleme</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
