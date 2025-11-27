import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HelpContactSettingsProps {
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  serviceHours: string;
  otherInfo: string;
  legalInfo: string;
  onContactPersonChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onServiceHoursChange: (value: string) => void;
  onOtherInfoChange: (value: string) => void;
  onLegalInfoChange: (value: string) => void;
}

export const HelpContactSettings = ({
  contactPerson,
  contactPhone,
  contactEmail,
  serviceHours,
  otherInfo,
  legalInfo,
  onContactPersonChange,
  onContactPhoneChange,
  onContactEmailChange,
  onServiceHoursChange,
  onOtherInfoChange,
  onLegalInfoChange,
}: HelpContactSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hilfe & Kontakt</CardTitle>
        <CardDescription>Informationen für den Hilfe-Bereich</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-person">Ansprechpartner</Label>
          <Input
            id="contact-person"
            value={contactPerson}
            onChange={(e) => onContactPersonChange(e.target.value)}
            placeholder="Max Mustermann"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Telefonnummer</Label>
            <Input
              id="contact-phone"
              value={contactPhone}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              placeholder="+49 123 456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">E-Mail-Adresse</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => onContactEmailChange(e.target.value)}
              placeholder="support@feuerwehr.de"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="service-hours">Servicezeiten</Label>
          <Textarea
            id="service-hours"
            value={serviceHours}
            onChange={(e) => onServiceHoursChange(e.target.value)}
            placeholder="Mo-Fr: 8:00-17:00 Uhr&#10;Sa: 9:00-13:00 Uhr"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="other-info">Sonstige Informationen</Label>
          <Textarea
            id="other-info"
            value={otherInfo}
            onChange={(e) => onOtherInfoChange(e.target.value)}
            placeholder="Weitere wichtige Informationen zum System..."
            rows={4}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="legal-info">Rechtliche Informationen</Label>
          <Textarea
            id="legal-info"
            value={legalInfo}
            onChange={(e) => onLegalInfoChange(e.target.value)}
            placeholder="Impressum, Datenschutz, etc."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};