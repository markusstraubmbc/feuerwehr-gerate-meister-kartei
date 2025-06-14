
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wrench, CalendarCheck, Clock, Package, Settings } from 'lucide-react';

const AppSidebar = () => {
  const [systemName, setSystemName] = useState('Feuerwehr Inventar');
  const [logoUrl, setLogoUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const location = useLocation();

  useEffect(() => {
    // Load initial values from localStorage
    setSystemName(localStorage.getItem('systemName') || 'Feuerwehr Inventar');
    setLogoUrl(localStorage.getItem('systemLogo') || '');
    setBackgroundColor(localStorage.getItem('menuBackgroundColor') || '#1e293b');
    setTextColor(localStorage.getItem('menuTextColor') || '#ffffff');
    setSelectedColor(localStorage.getItem('menuSelectedColor') || '#3b82f6');

    // Listen for system changes
    const handleSystemNameChange = (event: CustomEvent) => {
      setSystemName(event.detail);
    };

    const handleSystemLogoChange = (event: CustomEvent) => {
      setLogoUrl(event.detail);
    };

    const handleSystemColorsChange = (event: CustomEvent) => {
      setBackgroundColor(event.detail.backgroundColor);
      setTextColor(event.detail.textColor);
      setSelectedColor(event.detail.selectedColor);
    };

    window.addEventListener('systemNameChanged', handleSystemNameChange as EventListener);
    window.addEventListener('systemLogoChanged', handleSystemLogoChange as EventListener);
    window.addEventListener('systemColorsChanged', handleSystemColorsChange as EventListener);

    return () => {
      window.removeEventListener('systemNameChanged', handleSystemNameChange as EventListener);
      window.removeEventListener('systemLogoChanged', handleSystemLogoChange as EventListener);
      window.removeEventListener('systemColorsChanged', handleSystemColorsChange as EventListener);
    };
  }, []);

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
            className="h-12 w-12 object-contain rounded"
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
              to="/inventory"
              className={({ isActive }) => 
                `block px-4 py-2 rounded transition-colors ${getNavLinkClass({ isActive })}`
              }
              style={({ isActive }) => getNavLinkStyle(isActive)}
            >
              <Package className="inline-block w-5 h-5 mr-3" />
              Inventar
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
