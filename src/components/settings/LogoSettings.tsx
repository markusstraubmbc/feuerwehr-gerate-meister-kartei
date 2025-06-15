
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LogoSettingsProps {
  logoPreview: string;
  logoSize: string;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoSizeChange: (value: string) => void;
}

export const LogoSettings = ({ logoPreview, logoSize, onLogoChange, onLogoSizeChange }: LogoSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>Upload eines Logos für das System</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">Logo-Datei</Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={onLogoChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="logo-size">Logo-Größe (Pixel)</Label>
          <Input
            id="logo-size"
            type="number"
            min="16"
            max="200"
            value={logoSize}
            onChange={(e) => onLogoSizeChange(e.target.value)}
            placeholder="48"
          />
          <p className="text-sm text-muted-foreground">
            Empfohlene Größe: 48-96 Pixel
          </p>
        </div>
        
        {logoPreview && (
          <div className="space-y-2">
            <Label>Vorschau</Label>
            <div className="p-4 border rounded-md bg-muted/50">
              <img 
                src={logoPreview} 
                alt="Logo Vorschau" 
                style={{ 
                  width: `${logoSize}px`, 
                  height: `${logoSize}px`,
                  objectFit: 'contain'
                }}
                className="rounded"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
