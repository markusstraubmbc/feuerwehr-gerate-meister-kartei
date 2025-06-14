
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  Package,
  Settings,
  Wrench,
  Clock,
  MapPin,
  Users,
  Target,
  Calendar,
  Bell,
  QrCode
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Ausrüstung", href: "/equipment", icon: Package },
  { name: "Ausrüstung verwalten", href: "/equipment-management", icon: Settings },
  { name: "Wartung", href: "/maintenance", icon: Wrench },
  { name: "Wartungszeiten", href: "/maintenance-time", icon: Clock },
  { name: "Einsätze & Übungen", href: "/missions", icon: Target },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Benachrichtigungen", href: "/notifications", icon: Bell },
  { name: "Standorte", href: "/locations", icon: MapPin },
  { name: "Personen", href: "/person-management", icon: Users },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Feuerwehr Inventar</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-red-100 text-red-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
