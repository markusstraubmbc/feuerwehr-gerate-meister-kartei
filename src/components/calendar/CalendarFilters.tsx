
import { useState } from "react";
import { Filter, Calendar, User, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePersons } from "@/hooks/usePersons";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";

export interface CalendarFilters {
  personId?: string;
  templateId?: string;
  includeCompleted: boolean;
  includeOverdue: boolean;
  includeUpcoming: boolean;
}

interface CalendarFilterProps {
  onFiltersChange: (filters: CalendarFilters) => void;
  currentFilters: CalendarFilters;
}

export function CalendarFilters({ onFiltersChange, currentFilters }: CalendarFilterProps) {
  const { data: persons = [] } = usePersons();
  const { data: templates = [] } = useMaintenanceTemplates();

  const updateFilter = (key: keyof CalendarFilters, value: any) => {
    onFiltersChange({
      ...currentFilters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      includeCompleted: true,
      includeOverdue: true,
      includeUpcoming: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Kalender-Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="person-filter">Verantwortliche Person</Label>
            <Select 
              value={currentFilters.personId || "all"} 
              onValueChange={(value) => updateFilter('personId', value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Personen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Personen</SelectItem>
                {persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="template-filter">Wartungstyp</Label>
            <Select 
              value={currentFilters.templateId || "all"} 
              onValueChange={(value) => updateFilter('templateId', value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Wartungstypen" />
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
          </div>
        </div>

        <div className="space-y-3">
          <Label>Status-Filter</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-upcoming" className="text-sm">Anstehende Wartungen</Label>
              <Switch
                id="include-upcoming"
                checked={currentFilters.includeUpcoming}
                onCheckedChange={(checked) => updateFilter('includeUpcoming', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-overdue" className="text-sm">Überfällige Wartungen</Label>
              <Switch
                id="include-overdue"
                checked={currentFilters.includeOverdue}
                onCheckedChange={(checked) => updateFilter('includeOverdue', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-completed" className="text-sm">Abgeschlossene Wartungen</Label>
              <Switch
                id="include-completed"
                checked={currentFilters.includeCompleted}
                onCheckedChange={(checked) => updateFilter('includeCompleted', checked)}
              />
            </div>
          </div>
        </div>

        <Button onClick={clearFilters} variant="outline" className="w-full">
          Filter zurücksetzen
        </Button>
      </CardContent>
    </Card>
  );
}
