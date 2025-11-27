import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Save } from "lucide-react";

export const MissionReportEmailSettings = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "mission_report_email")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setEmail(data.value as string);
      }
    } catch (error) {
      console.error("Error loading mission report email settings:", error);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate email format
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
        return;
      }

      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "mission_report_email",
          value: email.trim(),
        });

      if (error) throw error;

      toast.success("E-Mail-Adresse gespeichert");
    } catch (error) {
      console.error("Error saving mission report email:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Automatischer Einsatzbericht-Versand
        </CardTitle>
        <CardDescription>
          E-Mail-Adresse, an die automatisch Einsatz- und Übungsberichte gesendet werden.
          Verantwortliche Personen erhalten eine Kopie (CC).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mission_report_email">E-Mail-Adresse für Berichte</Label>
          <Input
            id="mission_report_email"
            type="email"
            placeholder="berichte@feuerwehr.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Nach dem Speichern eines Einsatzes oder einer Übung wird automatisch ein PDF-Bericht
            an diese Adresse gesendet.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Speichere..." : "Speichern"}
        </Button>
      </CardContent>
    </Card>
  );
};
