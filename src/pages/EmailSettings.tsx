
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Send, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EmailSettings = () => {
  const navigate = useNavigate();
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  
  // Email configuration state
  const [emailConfig, setEmailConfig] = useState({
    enabled: localStorage.getItem('emailNotificationsEnabled') === 'true',
    fromEmail: localStorage.getItem('emailFromAddress') || '',
    recipientEmails: localStorage.getItem('emailRecipients') || '',
    reminderDays: parseInt(localStorage.getItem('reminderDays') || '7'),
    monthlyReport: localStorage.getItem('monthlyReportEnabled') === 'true',
    testEmail: localStorage.getItem('testEmailAddress') || ''
  });

  const handleSave = () => {
    localStorage.setItem('emailNotificationsEnabled', emailConfig.enabled.toString());
    localStorage.setItem('emailFromAddress', emailConfig.fromEmail);
    localStorage.setItem('emailRecipients', emailConfig.recipientEmails);
    localStorage.setItem('reminderDays', emailConfig.reminderDays.toString());
    localStorage.setItem('monthlyReportEnabled', emailConfig.monthlyReport.toString());
    localStorage.setItem('testEmailAddress', emailConfig.testEmail);
    
    toast.success('E-Mail-Einstellungen wurden gespeichert');
  };

  const handleTestEmail = async () => {
    if (!emailConfig.testEmail) {
      toast.error('Bitte geben Sie eine Test-E-Mail-Adresse ein');
      return;
    }

    setIsTestingEmail(true);
    
    try {
      console.log('Sending test email to:', emailConfig.testEmail);
      
      const { data, error } = await supabase.functions.invoke('maintenance-notifications', {
        body: {
          type: 'test',
          testEmail: emailConfig.testEmail,
          message: 'Dies ist eine Test-E-Mail vom Feuerwehr Inventar System.',
          subject: 'Test-E-Mail - Feuerwehr Inventar'
        }
      });

      console.log('Test email response:', { data, error });

      if (error) {
        console.error('Test email error:', error);
        throw error;
      }

      toast.success(`Test-E-Mail wurde erfolgreich an ${emailConfig.testEmail} gesendet`);
      
    } catch (error) {
      console.error('Fehler beim Senden der Test-E-Mail:', error);
      
      // More specific error messages
      if (error.message?.includes('RESEND_API_KEY')) {
        toast.error('E-Mail-Service nicht konfiguriert: RESEND_API_KEY fehlt');
      } else if (error.message?.includes('network')) {
        toast.error('Netzwerkfehler beim Senden der E-Mail');
      } else if (error.message?.includes('invalid email')) {
        toast.error('Ungültige E-Mail-Adresse');
      } else {
        toast.error(`Fehler beim Senden der Test-E-Mail: ${error.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">E-Mail-Benachrichtigungen</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Allgemeine Einstellungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie die grundlegenden E-Mail-Einstellungen für automatische Benachrichtigungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="email-notifications"
                checked={emailConfig.enabled}
                onCheckedChange={(checked) => 
                  setEmailConfig(prev => ({ ...prev, enabled: checked }))
                }
              />
              <Label htmlFor="email-notifications">E-Mail-Benachrichtigungen aktivieren</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="from-email">Absender-E-Mail-Adresse</Label>
              <Input
                id="from-email"
                type="email"
                value={emailConfig.fromEmail}
                onChange={(e) => 
                  setEmailConfig(prev => ({ ...prev, fromEmail: e.target.value }))
                }
                placeholder="system@feuerwehr.de"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient-emails">Empfänger-E-Mail-Adressen</Label>
              <Textarea
                id="recipient-emails"
                value={emailConfig.recipientEmails}
                onChange={(e) => 
                  setEmailConfig(prev => ({ ...prev, recipientEmails: e.target.value }))
                }
                placeholder="wartung@feuerwehr.de, admin@feuerwehr.de"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Mehrere E-Mail-Adressen mit Komma trennen
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erinnerungseinstellungen</CardTitle>
            <CardDescription>
              Bestimmen Sie, wann Erinnerungen für anstehende Wartungen gesendet werden sollen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-days">Erinnerung X Tage vor Fälligkeit</Label>
              <Input
                id="reminder-days"
                type="number"
                min="1"
                max="30"
                value={emailConfig.reminderDays}
                onChange={(e) => 
                  setEmailConfig(prev => ({ ...prev, reminderDays: parseInt(e.target.value) || 7 }))
                }
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="monthly-report"
                checked={emailConfig.monthlyReport}
                onCheckedChange={(checked) => 
                  setEmailConfig(prev => ({ ...prev, monthlyReport: checked }))
                }
              />
              <Label htmlFor="monthly-report">Monatlichen Wartungsbericht senden</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test-E-Mail</CardTitle>
            <CardDescription>
              Senden Sie eine Test-E-Mail, um die Konfiguration zu überprüfen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test-E-Mail-Adresse</Label>
              <Input
                id="test-email"
                type="email"
                value={emailConfig.testEmail}
                onChange={(e) => 
                  setEmailConfig(prev => ({ ...prev, testEmail: e.target.value }))
                }
                placeholder="test@example.com"
              />
            </div>
            
            <Button 
              onClick={handleTestEmail}
              disabled={isTestingEmail || !emailConfig.testEmail}
              variant="outline"
              className="w-full"
            >
              {isTestingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Test-E-Mail wird gesendet...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Test-E-Mail senden
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Einstellungen speichern
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
