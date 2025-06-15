
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SystemNameSettingsProps {
  systemName: string;
  onSystemNameChange: (value: string) => void;
}

export const SystemNameSettings = ({ systemName, onSystemNameChange }: SystemNameSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Systemname</CardTitle>
        <CardDescription>Anpassen des Systemnamens, der in der Seitenleiste angezeigt wird</CardDescription>
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
      </CardContent>
    </Card>
  );
};
