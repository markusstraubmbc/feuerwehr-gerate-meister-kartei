
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import EquipmentManagement from "./pages/EquipmentManagement";
import Maintenance from "./pages/Maintenance";
import Locations from "./pages/Locations";
import Settings from "./pages/Settings";
import PersonManagement from "./pages/PersonManagement";
import NotFound from "./pages/NotFound";
import MaintenanceTemplateSettings from "./pages/MaintenanceTemplateSettings";
import EmailSettings from "./pages/EmailSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 Minuten
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipment" element={<EquipmentManagement />} />
            <Route path="/equipment-management" element={<Navigate to="/equipment" replace />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/person-management" element={<PersonManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/maintenance-templates" element={<MaintenanceTemplateSettings />} />
            <Route path="/settings/email" element={<EmailSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
