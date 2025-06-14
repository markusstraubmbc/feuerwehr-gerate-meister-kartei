
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Inventory from "./pages/Inventory";
import Maintenance from "./pages/Maintenance";
import MaintenanceTime from "./pages/MaintenanceTime";
import Locations from "./pages/Locations";
import PersonManagement from "./pages/PersonManagement";
import Settings from "./pages/Settings";
import SystemSettings from "./pages/SystemSettings";
import EmailSettings from "./pages/EmailSettings";
import MaintenanceTemplateSettings from "./pages/MaintenanceTemplateSettings";
import EquipmentManagement from "./pages/EquipmentManagement";
import NotFound from "./pages/NotFound";

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/equipment-management" element={<EquipmentManagement />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/maintenance-time" element={<MaintenanceTime />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/person-management" element={<PersonManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/system" element={<SystemSettings />} />
              <Route path="/settings/email" element={<EmailSettings />} />
              <Route path="/settings/maintenance-templates" element={<MaintenanceTemplateSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
