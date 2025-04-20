
import "./App.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Locations from "@/pages/Locations";
import Equipment from "@/pages/Equipment";
import EquipmentManagement from "@/pages/EquipmentManagement";
import Inventory from "@/pages/Inventory";
import PersonManagement from "./pages/PersonManagement";
import Maintenance from "./pages/Maintenance";
import Settings from "./pages/Settings";
import EmailSettings from "./pages/EmailSettings";
import MaintenanceTemplateSettings from "./pages/MaintenanceTemplateSettings";
import MaintenanceTime from "./pages/MaintenanceTime";
import Index from "./pages/Index";
import Reports from "./pages/Reports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: <Index />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "locations",
        element: <Locations />,
      },
      {
        path: "equipment",
        element: <Equipment />,
      },
      {
        path: "equipment-management",
        element: <EquipmentManagement />,
      },
      {
        path: "inventory",
        element: <Inventory />,
      },
      {
        path: "person-management",
        element: <PersonManagement />,
      },
      {
        path: "maintenance",
        element: <Maintenance />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "settings/email",
        element: <EmailSettings />,
      },
      {
        path: "settings/maintenance-templates",
        element: <MaintenanceTemplateSettings />,
      },
      {
        path: "settings/maintenance-time",
        element: <MaintenanceTime />,
      },
    ],
  },
]);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
