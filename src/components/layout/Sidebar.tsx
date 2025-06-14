
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  Settings,
  Wrench,
  Clock,
  Target,
  Calendar,
  Bell,
  Cog
} from "lucide-react";
import {
  Sidebar as SidebarBase,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useGlobalSettings } from "./GlobalSettingsProvider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Ausrüstung", href: "/equipment", icon: Package },
  { name: "Ausrüstung verwalten", href: "/equipment-management", icon: Cog },
  { name: "Wartung", href: "/maintenance", icon: Wrench },
  { name: "Wartungszeiten", href: "/maintenance-time", icon: Clock },
  { name: "Einsätze & Übungen", href: "/missions", icon: Target },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Benachrichtigungen", href: "/notifications", icon: Bell },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { settings, isLoading } = useGlobalSettings();
  
  const systemName = settings?.companyName || "Feuerwehr Inventar";
  const logo = settings?.companyLogo;
  const logoSize = settings?.logoSize || "48";

  return (
    <SidebarBase 
      style={{
        backgroundColor: settings?.menuBackgroundColor || undefined,
        color: settings?.menuTextColor || undefined,
      }}
    >
      <SidebarHeader>
        <div className="px-4 py-2 flex items-center gap-3">
          {logo && (
            <img 
              src={logo} 
              alt="Logo" 
              style={{ 
                width: `${logoSize}px`, 
                height: `${logoSize}px`,
                objectFit: 'contain'
              }}
              className="rounded"
            />
          )}
          <h1 
            className="text-xl font-bold"
            style={{ color: settings?.menuTextColor || undefined }}
          >
            {systemName}
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel 
            style={{ color: settings?.menuTextColor || undefined }}
          >
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 w-full px-2 py-2 rounded-md transition-colors",
                          isActive 
                            ? "font-medium text-white" 
                            : "hover:bg-opacity-20 hover:bg-white"
                        )
                      }
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? settings?.menuSelectedColor || '#3b82f6' : undefined,
                        color: isActive ? '#ffffff' : settings?.menuTextColor || undefined,
                      })}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarBase>
  );
}
