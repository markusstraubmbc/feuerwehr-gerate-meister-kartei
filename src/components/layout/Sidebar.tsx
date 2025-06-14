import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Package as PackageIcon, 
  FileSearch, 
  Settings, 
  LayoutDashboard, 
  Menu, 
  X, 
  CircleAlert,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  // On mobile, start with collapsed sidebar
  const [expanded, setExpanded] = useState(window.innerWidth > 768);
  const [systemName, setSystemName] = useState(
    localStorage.getItem('systemName') || 'Feuerwehr Inventar'
  );
  const [logoUrl, setLogoUrl] = useState(
    localStorage.getItem('systemLogo') || ''
  );
  const [backgroundColor, setBackgroundColor] = useState(
    localStorage.getItem('menuBackgroundColor') || '#1e293b'
  );
  const [textColor, setTextColor] = useState(
    localStorage.getItem('menuTextColor') || '#ffffff'
  );
  
  // Update expanded state when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setExpanded(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for system settings changes
  useEffect(() => {
    const handleSystemNameChange = (event: CustomEvent) => {
      setSystemName(event.detail);
    };

    const handleSystemLogoChange = (event: CustomEvent) => {
      setLogoUrl(event.detail);
    };

    window.addEventListener('systemNameChanged', handleSystemNameChange as EventListener);
    window.addEventListener('systemLogoChanged', handleSystemLogoChange as EventListener);

    return () => {
      window.removeEventListener('systemNameChanged', handleSystemNameChange as EventListener);
      window.removeEventListener('systemLogoChanged', handleSystemLogoChange as EventListener);
    };
  }, []);

  // Listen for color changes
  useEffect(() => {
    const handleSystemColorsChange = (event: CustomEvent) => {
      setBackgroundColor(event.detail.backgroundColor);
      setTextColor(event.detail.textColor);
    };

    window.addEventListener('systemColorsChanged', handleSystemColorsChange as EventListener);

    return () => {
      window.removeEventListener('systemColorsChanged', handleSystemColorsChange as EventListener);
    };
  }, []);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <aside 
      className={cn(
        "flex flex-col border-r transition-all duration-300", 
        expanded ? "w-64" : "w-16"
      )}
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex items-center p-4 h-16">
        {expanded ? (
          <div className="flex items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="System Logo" 
                className="h-8 w-8 object-contain"
              />
            ) : (
              <CircleAlert className="h-6 w-6 text-fire-red" />
            )}
            <h2 className="ml-2 text-lg font-bold truncate" style={{ color: textColor }}>
              {systemName}
            </h2>
          </div>
        ) : (
          <>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="System Logo" 
                className="h-6 w-6 mx-auto object-contain"
              />
            ) : (
              <CircleAlert className="h-6 w-6 mx-auto text-fire-red" />
            )}
          </>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="ml-auto hover:bg-opacity-20"
          style={{ color: textColor }}
        >
          {expanded ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={expanded} textColor={textColor} />
        <NavItem to="/equipment" icon={<PackageIcon size={20} />} label="Ausrüstung" expanded={expanded} textColor={textColor} />
        <NavItem to="/maintenance" icon={<FileSearch size={20} />} label="Wartung" expanded={expanded} textColor={textColor} />
        <NavItem to="/maintenance-time" icon={<Clock size={20} />} label="Zeitauswertung" expanded={expanded} textColor={textColor} />
        <NavItem to="/settings" icon={<Settings size={20} />} label="Einstellungen" expanded={expanded} textColor={textColor} />
      </nav>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  textColor: string;
}

function NavItem({ to, icon, label, expanded, textColor }: NavItemProps) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center p-2 rounded-md hover:bg-opacity-20 hover:bg-white group transition-colors",
        !expanded && "justify-center"
      )}
      style={{ color: textColor }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {expanded && <span className="ml-3">{label}</span>}
      {!expanded && (
        <div className="absolute left-16 rounded-md px-2 py-1 ml-6 bg-gray-800 text-white text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {label}
        </div>
      )}
    </Link>
  );
}
