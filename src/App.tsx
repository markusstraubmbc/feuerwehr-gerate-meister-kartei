
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AppWrapper } from "./components/layout/AppWrapper";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Maintenance from "./pages/Maintenance";
import MaintenanceTime from "./pages/MaintenanceTime";
import Missions from "./pages/Missions";
import CalendarPage from "./pages/CalendarPage";
import NotificationsPage from "./pages/NotificationsPage";
import Locations from "./pages/Locations";
import PersonManagement from "./pages/PersonManagement";
import Settings from "./pages/Settings";
import SystemSettings from "./pages/SystemSettings";
import MaintenanceTemplateSettings from "./pages/MaintenanceTemplateSettings";
import EmailSettings from "./pages/EmailSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWrapper>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="maintenance-time" element={<MaintenanceTime />} />
                <Route path="missions" element={<Missions />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="locations" element={<Locations />} />
                <Route path="person-management" element={<PersonManagement />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/system" element={<SystemSettings />} />
                <Route path="settings/maintenance-templates" element={<MaintenanceTemplateSettings />} />
                <Route path="settings/email" element={<EmailSettings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppWrapper>
    </QueryClientProvider>
  );
}

export default App;
