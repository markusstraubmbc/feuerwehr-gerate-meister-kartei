import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface MenuColorSettingsProps {
  backgroundColor: string;
  textColor: string;
  selectedColor: string;
  onBackgroundColorChange: (value: string) => void;
  onTextColorChange: (value: string) => void;
  onSelectedColorChange: (value: string) => void;
  onReset?: () => void;
}

export const MenuColorSettings = ({ 
  backgroundColor, 
  textColor, 
  selectedColor, 
  onBackgroundColorChange, 
  onTextColorChange, 
  onSelectedColorChange,
  onReset
}: MenuColorSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Menü-Farbeinstellungen</CardTitle>
            <CardDescription>Anpassen der Farben für die Seitenleiste</CardDescription>
          </div>
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="background-color">Hintergrundfarbe</Label>
          <div className="flex gap-2">
            <Input
              id="background-color"
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="w-16 h-10 p-1 border"
            />
            <Input
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              placeholder="#1e293b"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-color">Textfarbe</Label>
          <div className="flex gap-2">
            <Input
              id="text-color"
              type="color"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="w-16 h-10 p-1 border"
            />
            <Input
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="selected-color">Farbe für ausgewähltes Menü</Label>
          <div className="flex gap-2">
            <Input
              id="selected-color"
              type="color"
              value={selectedColor}
              onChange={(e) => onSelectedColorChange(e.target.value)}
              className="w-16 h-10 p-1 border"
            />
            <Input
              value={selectedColor}
              onChange={(e) => onSelectedColorChange(e.target.value)}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>

        <div className="p-4 border rounded-md" style={{ backgroundColor }}>
          <div className="space-y-2">
            <div 
              className="p-2 rounded"
              style={{ color: textColor }}
            >
              Normal Menüeintrag
            </div>
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: selectedColor, color: '#ffffff' }}
            >
              Ausgewählter Menüeintrag
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
