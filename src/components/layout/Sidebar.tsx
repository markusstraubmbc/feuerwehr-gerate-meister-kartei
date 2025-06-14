
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wrench, CalendarCheck, Clock, Settings } from 'lucide-react';
import { useGlobalSettings } from './GlobalSettingsProvider';

const AppSidebar = () => {
  const { settings } = useGlobalSettings();

  const systemName = settings.companyName || 'Feuerwehr Inventar';
  const logoUrl = settings.companyLogo || '';
  const logoSize = settings.logoSize || '48';
  const backgroundColor = settings.menuBackgroundColor || '#1e293b';
  const textColor = settings.menuTextColor || '#ffffff';
  const selectedColor = settings.menuSelectedColor || '#3b82f6';

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "font-medium" 
      : "hover:bg-white hover:bg-opacity-10";

  const getNavLinkStyle = (isActive: boolean) => ({
    color: isActive ? '#ffffff' : textColor,
    backgroundColor: isActive ? selectedColor : 'transparent'
  });

  return (
    <aside 
      className="w-64 h-screen p-4 text-white flex flex-col"
      style={{ backgroundColor }}
    >
      {/* Logo and System Name Section */}
      <div className="mb-8 flex flex-col items-center space-y-2">
        {logoUrl && (
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
        <h1 
          className="text-xl font-bold text-center"
          style={{ color: textColor }}
        >
          {systemName}
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => 
                `block px-4 py-2 rounded transition-colors ${getNavLinkClass({ isActive })}`
              }
              style={({ isActive }) => getNavLinkStyle(isActive)}
            >
              <Home className="inline-block w-5 h-5 mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/equipment-management"
              className={({ isActive }) => 
                `block px-4 py-2 rounded transition-colors ${getNavLinkClass({ isActive })}`
              }
              style={({ isActive }) => getNavLinkStyle(isActive)}
            >
              <Wrench className="inline-block w-5 h-5 mr-3" />
              Ausrüstung
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/maintenance"
              className={({ isActive }) => 
                `block px-4 py-2 rounded transition-colors ${getNavLinkClass({ isActive })}`
              }
              style={({ isActive }) => getNavLinkStyle(isActive)}
            >
              <CalendarCheck className="inline-block w-5 h-5 mr-3" />
              Wartung
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/maintenance-time"
              className={({ isActive }) => 
                `block px-4 py-2 rounded transition-colors ${getNavLinkClass({ isActive })}`
              }
              style={({ isActive }) => getNavLinkStyle(isActive)}
            >
              <Clock className="inline-block w-5 h-5 mr-3" />
              Wartungs-Zeitauswertung
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => 
                `block px-4 py-2 rounded transition-colors ${getNavLinkClass({ isActive })}`
              }
              style={({ isActive }) => getNavLinkStyle(isActive)}
            >
              <Settings className="inline-block w-5 h-5 mr-3" />
              Einstellungen
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AppSidebar;
