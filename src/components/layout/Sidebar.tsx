
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wrench, CalendarCheck, Clock, Settings } from 'lucide-react';
import { useGlobalSettings } from './GlobalSettingsProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const { settings } = useGlobalSettings();
  const location = useLocation();
  const { state } = useSidebar();

  const systemName = settings.companyName || 'Feuerwehr Inventar';
  const logoUrl = settings.companyLogo || '';
  const logoSize = settings.logoSize || '48';
  const backgroundColor = settings.menuBackgroundColor || '#1e293b';
  const textColor = settings.menuTextColor || '#ffffff';
  const selectedColor = settings.menuSelectedColor || '#3b82f6';

  const isCollapsed = state === 'collapsed';

  const menuItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/equipment-management", icon: Wrench, label: "Ausrüstung" },
    { to: "/maintenance", icon: CalendarCheck, label: "Wartung" },
    { to: "/maintenance-time", icon: Clock, label: "Wartungs-Zeitauswertung" },
    { to: "/settings", icon: Settings, label: "Einstellungen" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getNavLinkStyle = (active: boolean) => ({
    color: active ? '#ffffff' : textColor,
    backgroundColor: active ? selectedColor : 'transparent'
  });

  return (
    <Sidebar 
      style={{ backgroundColor }}
      className="border-r"
    >
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-center space-y-2">
          {logoUrl && !isCollapsed && (
            <img 
              src={logoUrl} 
              alt="System Logo" 
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                objectFit: 'contain'
              }}
              className="rounded"
            />
          )}
          {logoUrl && isCollapsed && (
            <img 
              src={logoUrl} 
              alt="System Logo" 
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain'
              }}
              className="rounded"
            />
          )}
          {!isCollapsed && (
            <h1 
              className="text-xl font-bold text-center"
              style={{ color: textColor }}
            >
              {systemName}
            </h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: textColor }}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton 
                      asChild
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <NavLink
                        to={item.to}
                        className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
                        style={getNavLinkStyle(active)}
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
