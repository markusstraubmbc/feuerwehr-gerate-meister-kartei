
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export const SystemBackupSettings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Download backup
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        "https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/database-backup",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Backup konnte nicht geladen werden.");
      const data = await response.json();
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
      const fileText = await file.text();
      const data = JSON.parse(fileText);

      const response = await fetch(
        "https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/database-backup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        let errorMsg = "Fehler beim Wiederherstellen des Backups.";
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg += " " + errData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      toast.success("Backup-Daten wurden erfolgreich wiederhergestellt!");
    } catch (err: any) {
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
