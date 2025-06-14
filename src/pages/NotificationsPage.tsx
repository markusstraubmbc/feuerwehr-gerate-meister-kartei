
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Benachrichtigungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Benachrichtigungseinstellungen
        </p>
      </div>
      
      <NotificationSettings />
    </div>
  );
};

export default NotificationsPage;
