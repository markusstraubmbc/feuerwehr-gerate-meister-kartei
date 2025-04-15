
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Barcode,
  ClipboardCheck,
  Package, 
  FileSpreadsheet, 
  Settings, 
  LayoutDashboard, 
  Menu, 
  X, 
  CircleAlert,
  Store,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);

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
            <CircleAlert className="h-6 w-6 text-fire-red" />
            <h2 className="ml-2 text-lg font-bold text-white truncate">Gerätemeister</h2>
          </div>
        ) : (
          <CircleAlert className="h-6 w-6 mx-auto text-fire-red" />
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
        <NavItem to="/scanner" icon={<Barcode size={20} />} label="Scanner" expanded={expanded} />
        <NavItem to="/equipment" icon={<Package size={20} />} label="Geräte" expanded={expanded} />
        <NavItem to="/maintenance" icon={<ClipboardCheck size={20} />} label="Prüfungen" expanded={expanded} />
        <NavItem to="/inventory" icon={<Store size={20} />} label="Lager" expanded={expanded} />
        <NavItem to="/reports" icon={<FileText size={20} />} label="Berichte" expanded={expanded} />
        <NavItem to="/import-export" icon={<FileSpreadsheet size={20} />} label="Import/Export" expanded={expanded} />
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
        <div className="absolute left-16 rounded-md px-2 py-1 ml-6 bg-sidebar-primary text-sidebar-primary-foreground text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          {label}
        </div>
      )}
    </Link>
  );
}
