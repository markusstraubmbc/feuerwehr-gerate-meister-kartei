
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
  useSidebar,
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
  const { isMobile, setOpenMobile } = useSidebar();
  
  const systemName = settings?.companyName || "Feuerwehr Inventar";
  const logo = settings?.companyLogo;
  const logoSize = settings?.logoSize || "48";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const menuBackgroundColor = settings?.menuBackgroundColor || '#1e293b';
  const menuTextColor = settings?.menuTextColor || '#ffffff';
  const menuSelectedColor = settings?.menuSelectedColor || '#3b82f6';

  return (
    <SidebarBase 
      className="border-r"
      style={{
        backgroundColor: menuBackgroundColor,
        borderColor: menuBackgroundColor,
      } as React.CSSProperties}
    >
      <SidebarHeader 
        className="border-b"
        style={{ 
          backgroundColor: menuBackgroundColor,
          borderColor: menuBackgroundColor,
        }}
      >
        <div className="px-4 py-2 flex flex-col items-center gap-2">
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
            className="text-xl font-bold text-center"
            style={{ color: menuTextColor }}
          >
            {systemName}
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent 
        style={{ backgroundColor: menuBackgroundColor }}
      >
        <SidebarGroup>
          <SidebarGroupLabel 
            style={{ color: menuTextColor }}
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
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 w-full px-2 py-2 rounded-md transition-colors",
                          "hover:bg-opacity-20 hover:bg-white"
                        )
                      }
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? menuSelectedColor : 'transparent',
                        color: isActive ? '#ffffff' : menuTextColor,
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon 
                            className="h-4 w-4" 
                            style={{ 
                              color: isActive ? '#ffffff' : menuTextColor
                            }}
                          />
                          <span style={{ color: isActive ? '#ffffff' : menuTextColor }}>
                            {item.name}
                          </span>
                        </>
                      )}
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
