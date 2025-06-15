
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SystemNameSettingsProps {
  systemName: string;
  onSystemNameChange: (value: string) => void;
  domainName: string;
  onDomainNameChange: (value: string) => void;
}

export const SystemNameSettings = ({ systemName, onSystemNameChange, domainName, onDomainNameChange }: SystemNameSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Systemname &amp; Domain</CardTitle>
        <CardDescription>
          Anpassen des Systemnamens (Seitenleiste) und Domain, die für Exporte (z.B. WebCal, Links) genutzt wird
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="system-name">Systemname</Label>
          <Input
            id="system-name"
            value={systemName}
            onChange={(e) => onSystemNameChange(e.target.value)}
            placeholder="Feuerwehr Inventar"
          />
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="system-domain">System-Domain</Label>
          <Input
            id="system-domain"
            value={domainName}
            onChange={(e) => onDomainNameChange(e.target.value)}
            placeholder="meine-feuerwehr.de"
          />
          <p className="text-sm text-muted-foreground">
            Diese Domain wird für Webcal-Links &amp; weitere Exporte verwendet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
