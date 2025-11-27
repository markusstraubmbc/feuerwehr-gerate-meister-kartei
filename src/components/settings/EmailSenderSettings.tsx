import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const EmailSenderSettings = () => {
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: emailData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "sender_email")
        .maybeSingle();

      const { data: nameData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "sender_name")
        .maybeSingle();

      if (emailData?.value) {
        setSenderEmail(emailData.value as string);
      }
      if (nameData?.value) {
        setSenderName(nameData.value as string);
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
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(senderEmail)) {
        toast.error("Ungültige E-Mail-Adresse");
        return;
      }

      const { error: emailError } = await supabase
        .from("settings")
        .upsert(
          {
            key: "sender_email",
            value: senderEmail,
          },
          { onConflict: "key" }
        );

      if (emailError) throw emailError;

      const { error: nameError } = await supabase
        .from("settings")
        .upsert(
          {
            key: "sender_name",
            value: senderName,
          },
          { onConflict: "key" }
        );

      if (nameError) throw nameError;

      toast.success("Absender-Einstellungen erfolgreich gespeichert");
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
        <CardTitle>E-Mail-Absender</CardTitle>
        <CardDescription>
          Konfigurieren Sie die Absender-Adresse für automatische E-Mails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Wichtig:</strong> Sie müssen die Domain Ihrer Absender-E-Mail bei Resend verifizieren.
            <br />
            Gehen Sie zu <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline text-primary">resend.com/domains</a> und fügen Sie Ihre Domain hinzu.
            <br />
            Beispiel: Wenn Ihre E-Mail <code>berichte@feuerwehr.de</code> ist, müssen Sie <code>feuerwehr.de</code> verifizieren.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="senderName">Absender-Name</Label>
          <Input
            id="senderName"
            placeholder="z.B. Feuerwehr Musterhausen"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senderEmail">Absender E-Mail-Adresse</Label>
          <Input
            id="senderEmail"
            type="email"
            placeholder="berichte@feuerwehr.de"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Diese E-Mail-Adresse muss bei Resend verifiziert sein.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Absender speichern
        </Button>
      </CardContent>
    </Card>
  );
};
