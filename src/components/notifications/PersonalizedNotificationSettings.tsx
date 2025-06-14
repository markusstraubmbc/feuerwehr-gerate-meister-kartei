
import { useState, useEffect } from "react";
import { User, Filter, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePersons } from "@/hooks/usePersons";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { toast } from "sonner";

interface NotificationRule {
  id: string;
  personId?: string;
  templateId?: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export function PersonalizedNotificationSettings() {
  const { data: persons = [] } = usePersons();
  const { data: templates = [] } = useMaintenanceTemplates();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("no_person_selected");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("no_template_selected");

  useEffect(() => {
    // Load saved rules from localStorage
    const savedRules = localStorage.getItem('notificationRules');
    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules));
      } catch (error) {
        console.error('Error loading notification rules:', error);
      }
    }
  }, []);

  const saveRules = (newRules: NotificationRule[]) => {
    setRules(newRules);
    localStorage.setItem('notificationRules', JSON.stringify(newRules));
    toast.success('Benachrichtigungsregeln wurden gespeichert');
  };

  const addRule = () => {
    const personId = selectedPerson === "no_person_selected" ? undefined : selectedPerson;
    const templateId = selectedTemplate === "no_template_selected" ? undefined : selectedTemplate;
    
    if (!personId && !templateId) {
      toast.error('Bitte wählen Sie eine Person oder einen Wartungstyp aus');
      return;
    }

    const existingRule = rules.find(r => 
      r.personId === personId && r.templateId === templateId
    );

    if (existingRule) {
      toast.error('Diese Regel existiert bereits');
      return;
    }

    const newRule: NotificationRule = {
      id: Date.now().toString(),
      personId,
      templateId,
      pushEnabled: true,
      emailEnabled: true,
    };

    saveRules([...rules, newRule]);
    setSelectedPerson("no_person_selected");
    setSelectedTemplate("no_template_selected");
  };

  const updateRule = (ruleId: string, updates: Partial<NotificationRule>) => {
    const newRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    saveRules(newRules);
  };

  const deleteRule = (ruleId: string) => {
    const newRules = rules.filter(rule => rule.id !== ruleId);
    saveRules(newRules);
    toast.success('Regel wurde gelöscht');
  };

  const clearAllRules = () => {
    setRules([]);
    localStorage.removeItem('notificationRules');
    toast.success('Alle Regeln wurden gelöscht');
  };

  const getPersonName = (personId?: string) => {
    if (!personId) return "Alle Personen";
    const person = persons.find(p => p.id === personId);
    return person ? `${person.first_name} ${person.last_name}` : "Unbekannte Person";
  };

  const getTemplateName = (templateId?: string) => {
    if (!templateId) return "Alle Wartungstypen";
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : "Unbekannter Wartungstyp";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Personalisierte Benachrichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="person-select">Person (optional)</Label>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Personen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_person_selected">Alle Personen</SelectItem>
                {persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="template-select">Wartungstyp (optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Wartungstypen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_template_selected">Alle Wartungstypen</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={addRule} className="w-full">
              Regel hinzufügen
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Aktive Benachrichtigungsregeln</h3>
            {rules.length > 0 && (
              <Button onClick={clearAllRules} variant="outline" size="sm">
                Alle löschen
              </Button>
            )}
          </div>
          
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine spezifischen Regeln definiert. Alle Benachrichtigungen werden an alle Personen gesendet.
            </p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {getPersonName(rule.personId)} → {getTemplateName(rule.templateId)}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.pushEnabled}
                        onCheckedChange={(checked) => updateRule(rule.id, { pushEnabled: checked })}
                      />
                      <Label className="text-xs">Push</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.emailEnabled}
                        onCheckedChange={(checked) => updateRule(rule.id, { emailEnabled: checked })}
                      />
                      <Label className="text-xs">E-Mail</Label>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteRule(rule.id)}
                >
                  Löschen
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Personenfilter:</strong> Benachrichtigungen nur für bestimmte verantwortliche Personen</p>
          <p>• <strong>Wartungstyp-Filter:</strong> Benachrichtigungen nur für bestimmte Wartungsarten</p>
          <p>• <strong>Kombinationsregeln:</strong> Spezifische Einstellungen für Person + Wartungstyp</p>
        </div>
      </CardContent>
    </Card>
  );
}
