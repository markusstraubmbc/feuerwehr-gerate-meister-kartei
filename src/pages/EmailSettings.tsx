
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Define a more strict type for email settings
interface EmailSettings {
  upcoming_days_interval: number;
  monthly_report_day: number;
}

const DEFAULT_SETTINGS: EmailSettings = {
  upcoming_days_interval: 7,
  monthly_report_day: 1,
};

const EmailSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [testEmailAddress, setTestEmailAddress] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "email_settings")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // No settings found, return defaults
        return DEFAULT_SETTINGS;
      }

      // Safely parse the value
      try {
        const rawValue = data.value;
        return {
          upcoming_days_interval: 
            typeof rawValue === 'object' && 
            rawValue !== null && 
            'upcoming_days_interval' in rawValue ? 
            Number(rawValue.upcoming_days_interval) : 
            DEFAULT_SETTINGS.upcoming_days_interval,
          monthly_report_day: 
            typeof rawValue === 'object' && 
            rawValue !== null && 
            'monthly_report_day' in rawValue ? 
            Number(rawValue.monthly_report_day) : 
            DEFAULT_SETTINGS.monthly_report_day,
        };
      } catch (e) {
        console.error("Error parsing settings:", e);
        return DEFAULT_SETTINGS;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: EmailSettings) => {
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "email_settings")
        .maybeSingle();

      // Convert EmailSettings to a JSON-compatible object
      const jsonValue = {
        upcoming_days_interval: newSettings.upcoming_days_interval,
        monthly_report_day: newSettings.monthly_report_day
      };

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from("settings")
          .update({ value: jsonValue })
          .eq("key", "email_settings");

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("settings")
          .insert({ key: "email_settings", value: jsonValue });

        if (error) throw error;
      }

      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      toast({
        title: "Einstellungen gespeichert",
        description: "Die E-Mail-Einstellungen wurden erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
      });
    },
  });

  // Initialize settings from data
  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(settings);
  };

  // Handle test emails
  const sendTestEmail = async (type: string) => {
    if (!testEmailAddress) {
      toast({
        variant: "destructive",
        title: "E-Mail-Adresse erforderlich",
        description: "Bitte geben Sie eine E-Mail-Adresse ein.",
      });
      return;
    }

    try {
      console.log('Sending test email for type:', type, 'to:', testEmailAddress);
      
      const response = await fetch(
        "https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/email-scheduler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBraGtzd3ppeGF2dmlsZHRveHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDYyMzgsImV4cCI6MjA2MDMyMjIzOH0.534s7M7d-iQ43VIDthJ3uBLxqJPRg5o7TsMyeP2VoJo`,
          },
          body: JSON.stringify({ 
            type,
            test_email: testEmailAddress
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email function response error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Email function result:', result);

      toast({
        title: "Test-E-Mail gesendet",
        description: `${type === "upcoming" ? "Wartungsbenachrichtigung" : "Monatlicher Bericht"} wurde an ${testEmailAddress} gesendet.`,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        variant: "destructive",
        title: "Fehler beim Senden der Test-E-Mail",
        description: error.message || "Unbekannter Fehler beim Senden der E-Mail.",
      });
    }
  };

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Fehler beim Laden der E-Mail-Einstellungen. Bitte versuchen Sie es später erneut.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">E-Mail-Einstellungen</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungsintervalle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="upcoming_days_interval">
                  Vorlaufzeit für Wartungsbenachrichtigungen (Tage)
                </Label>
                <Input
                  id="upcoming_days_interval"
                  name="upcoming_days_interval"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.upcoming_days_interval}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-gray-500">
                  Verantwortliche Personen werden benachrichtigt, wenn eine Wartung innerhalb dieser Anzahl von Tagen fällig ist.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_report_day">
                  Tag des Monats für monatliche Berichte
                </Label>
                <Input
                  id="monthly_report_day"
                  name="monthly_report_day"
                  type="number"
                  min="1"
                  max="28"
                  value={settings.monthly_report_day}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-gray-500">
                  Der monatliche Bericht wird an diesem Tag des Monats gesendet (1-28).
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Einstellungen speichern
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test-E-Mails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              Hier können Sie Test-E-Mails senden, um die E-Mail-Funktionalität zu überprüfen.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="test_email">Test E-Mail-Adresse</Label>
              <Input
                id="test_email"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Geben Sie die E-Mail-Adresse ein, an die die Test-E-Mail gesendet werden soll.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => sendTestEmail("upcoming")}
                variant="outline"
                disabled={!testEmailAddress}
              >
                <Send className="mr-2 h-4 w-4" />
                Wartungsbenachrichtigung testen
              </Button>
              <Button
                onClick={() => sendTestEmail("monthly-report")}
                variant="outline"
                disabled={!testEmailAddress}
              >
                <Send className="mr-2 h-4 w-4" />
                Monatlichen Bericht testen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;
