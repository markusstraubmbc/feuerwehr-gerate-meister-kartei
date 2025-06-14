
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import Equipment from "./pages/Equipment";
import Maintenance from "./pages/Maintenance";
import MaintenanceTime from "./pages/MaintenanceTime";
import Settings from "./pages/Settings";
import PersonManagement from "./pages/PersonManagement";
import Locations from "./pages/Locations";
import MaintenanceTemplateSettings from "./pages/MaintenanceTemplateSettings";
import EmailSettings from "./pages/EmailSettings";
import SystemSettings from "./pages/SystemSettings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/maintenance-time" element={<MaintenanceTime />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/person-management" element={<PersonManagement />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/settings/maintenance-templates" element={<MaintenanceTemplateSettings />} />
              <Route path="/settings/email" element={<EmailSettings />} />
              <Route path="/settings/system" element={<SystemSettings />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
