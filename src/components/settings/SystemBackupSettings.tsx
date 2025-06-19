
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
// Supabase-Client importieren
import { supabase } from "@/integrations/supabase/client";

export const SystemBackupSettings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Holt das aktuelle Auth token mit verbesserter Fehlerbehandlung
  async function getAuthHeader() {
    try {
      // Erst versuchen, die aktuelle Session zu bekommen
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      
      console.log('Session check:', { hasSession: !!session, hasToken: !!session?.access_token, error });
      
      if (error) {
        console.error('Session error:', error);
        throw new Error(`Authentifizierungsfehler: ${error.message}`);
      }
      
      if (!session) {
        throw new Error("Keine aktive Sitzung gefunden. Bitte melden Sie sich erneut an.");
      }
      
      if (!session.access_token) {
        throw new Error("Kein gültiges Zugriffstoken gefunden. Bitte melden Sie sich erneut an.");
      }
      
      // Token-Gültigkeit prüfen
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('Token expired, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          throw new Error("Session abgelaufen. Bitte melden Sie sich erneut an.");
        }
        
        return { Authorization: `Bearer ${refreshData.session.access_token}` };
      }
      
      return { Authorization: `Bearer ${session.access_token}` };
    } catch (error: any) {
      console.error('Auth header error:', error);
      throw error;
    }
  }

  // Download backup
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      console.log('Starting backup download...');
      
      const authHeader = await getAuthHeader();
      console.log('Auth header obtained successfully');

      console.log('Making request to backup function...');
      const response = await fetch(
        "https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/database-backup",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.log('Error response body:', errorData);
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData);
              if (parsedError && parsedError.error) {
                errorMsg = parsedError.error;
              }
            } catch {
              errorMsg += ` - ${errorData}`;
            }
          }
        } catch (e) {
          console.log('Could not parse error response:', e);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Backup data received, keys:', Object.keys(data));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `feuerwehr-inventar-backup_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Backup wurde erfolgreich heruntergeladen!");
    } catch (err: any) {
      console.error('Backup download error:', err);
      toast.error("Fehler beim Erstellen des Backups: " + err.message);
    }
    setIsDownloading(false);
  };

  // Restore backup
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      console.log('Starting backup restore...');
      
      const fileText = await file.text();
      const data = JSON.parse(fileText);
      console.log('Backup file parsed, keys:', Object.keys(data));

      const authHeader = await getAuthHeader();
      console.log('Auth header obtained successfully for restore');

      console.log('Making restore request...');
      const response = await fetch(
        "https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/database-backup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify(data),
        }
      );

      console.log('Restore response status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.text();
          console.log('Restore error response:', errData);
          if (errData) {
            try {
              const parsedError = JSON.parse(errData);
              if (parsedError && parsedError.error) {
                errorMsg = parsedError.error;
              }
            } catch {
              errorMsg += ` - ${errData}`;
            }
          }
        } catch (e) {
          console.log('Could not parse restore error response:', e);
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Restore result:', result);

      toast.success("Backup-Daten wurden erfolgreich wiederhergestellt!");
    } catch (err: any) {
      console.error('Backup restore error:', err);
      toast.error("Fehler beim Wiederherstellen: " + err.message);
    }
    setIsUploading(false);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Download className="w-5 h-5" />
        System-Daten Backup & Wiederherstellung
      </h3>
      <p className="text-sm mb-2 text-muted-foreground">
        Erstellen Sie ein vollständiges Backup aller Systemdaten oder stellen Sie ein Backup wieder her.<br />
        <span className="font-medium text-destructive">
          Achtung: Beim Wiederherstellen werden alle aktuellen Daten überschrieben!
        </span>
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />{" "}
          {isDownloading ? "Download läuft..." : "Backup herunterladen"}
        </Button>
        <label className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <span>
              <Upload className="w-4 h-4 inline" />{" "}
              {isUploading ? "Wird wiederhergestellt..." : "Backup einspielen"}
            </span>
          </Button>
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
};
