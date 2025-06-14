
import { MaintenanceCalendar } from "@/components/calendar/MaintenanceCalendar";

const CalendarPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wartungskalender</h1>
        <p className="text-muted-foreground">
          Exportieren und abonnieren Sie Ihre Wartungstermine
        </p>
      </div>
      
      <MaintenanceCalendar />
    </div>
  );
};

export default CalendarPage;
