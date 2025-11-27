import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";

export const MaintenanceReportEmailSettings = () => {
  const [recipients, setRecipients] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "maintenance_report_recipients")
      .maybeSingle();

    if (error) {
      console.error("Error fetching maintenance report recipients:", error);
      return;
    }

    if (data?.value) {
      const emails = data.value as string[];
      setRecipients(emails.join("\n"));
    }
  };

  const validateEmails = (emailString: string): boolean => {
    const emails = emailString
      .split("\n")
      .map(e => e.trim())
      .filter(e => e.length > 0);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email));
  };

  const handleSave = async () => {
    const emailList = recipients
      .split("\n")
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length > 0 && !validateEmails(recipients)) {
      toast({
        title: "Ungültige E-Mail-Adressen",
        description: "Bitte überprüfen Sie die eingegebenen E-Mail-Adressen.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("settings")
      .upsert({
        key: "maintenance_report_recipients",
        value: emailList,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Einstellungen gespeichert",
      description: "Die Wartungsberichtempfänger wurden erfolgreich aktualisiert.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Wartungsberichtempfänger
        </CardTitle>
        <CardDescription>
          E-Mail-Adressen für monatliche Wartungsberichte. Zusätzlich werden die verantwortlichen Personen der Wartungsvorlagen benachrichtigt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maintenance-recipients">
            E-Mail-Adressen (eine pro Zeile)
          </Label>
          <Textarea
            id="maintenance-recipients"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="wartung@feuerwehr.de&#10;kommandant@feuerwehr.de"
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Diese Adressen erhalten monatlich einen Wartungsbericht mit allen fälligen und überfälligen Wartungen.
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </CardContent>
    </Card>
  );
};
