
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

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <aside 
      className={cn(
        "bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300", 
        expanded ? "w-64" : "w-16"
      )}
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
            <h2 className="ml-2 text-lg font-bold text-white truncate">{systemName}</h2>
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
          className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {expanded ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={expanded} />
        <NavItem to="/equipment" icon={<PackageIcon size={20} />} label="Ausrüstung" expanded={expanded} />
        <NavItem to="/maintenance" icon={<FileSearch size={20} />} label="Wartung" expanded={expanded} />
        <NavItem to="/maintenance-time" icon={<Clock size={20} />} label="Zeitauswertung" expanded={expanded} />
        <NavItem to="/settings" icon={<Settings size={20} />} label="Einstellungen" expanded={expanded} />
      </nav>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
}

function NavItem({ to, icon, label, expanded }: NavItemProps) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent group transition-colors",
        !expanded && "justify-center"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {expanded && <span className="ml-3">{label}</span>}
      {!expanded && (
        <div className="absolute left-16 rounded-md px-2 py-1 ml-6 bg-sidebar-primary text-sidebar-primary-foreground text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {label}
        </div>
      )}
    </Link>
  );
}
