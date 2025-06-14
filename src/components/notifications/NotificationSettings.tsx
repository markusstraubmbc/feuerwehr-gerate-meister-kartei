
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PushNotificationSettings } from "./PushNotificationSettings";
import { EmailNotificationSettings } from "./EmailNotificationSettings";
import { NotificationTypesSettings } from "./NotificationTypesSettings";
import { PersonalizedNotificationSettings } from "./PersonalizedNotificationSettings";

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Allgemeine Benachrichtigungseinstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PushNotificationSettings />
          <EmailNotificationSettings />
          <NotificationTypesSettings />
        </CardContent>
      </Card>

      <PersonalizedNotificationSettings />
    </div>
  );
}
