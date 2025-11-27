import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const WeeklyReportEmailSettings = () => {
  const [emailRecipients, setEmailRecipients] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "email_recipients")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        // value is stored as JSON array
        const recipients = Array.isArray(data.value) ? data.value.join("\n") : "";
        setEmailRecipients(recipients);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Parse email addresses (one per line)
      const recipients = emailRecipients
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        toast.error(`Ungültige E-Mail-Adressen: ${invalidEmails.join(", ")}`);
        return;
      }

      const { error } = await supabase
        .from("settings")
        .upsert(
          {
            key: "email_recipients",
            value: recipients,
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast.success("Wochenberichts-Empfänger erfolgreich gespeichert");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wochenberichts-Empfänger</CardTitle>
        <CardDescription>
          Konfigurieren Sie die E-Mail-Adressen, die wöchentlich Berichte über Wartungen und Ausrüstungsprobleme erhalten sollen.
          Geben Sie eine E-Mail-Adresse pro Zeile ein.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emailRecipients">E-Mail-Empfänger</Label>
          <Textarea
            id="emailRecipients"
            placeholder="beispiel@feuerwehr.de&#10;kommandant@feuerwehr.de"
            value={emailRecipients}
            onChange={(e) => setEmailRecipients(e.target.value)}
            rows={6}
          />
          <p className="text-sm text-muted-foreground">
            Eine E-Mail-Adresse pro Zeile. Diese Personen erhalten den automatischen Wochenbericht.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Empfänger speichern
        </Button>
      </CardContent>
    </Card>
  );
};
