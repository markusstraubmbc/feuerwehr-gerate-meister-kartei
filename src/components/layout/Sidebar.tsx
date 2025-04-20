
import { NavLink } from "react-router-dom";
import {
  Building,
  Cog,
  Database,
  FileText,
  Home,
  Package,
  Users,
  Wrench,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const sidebarItems = [
  {
    title: "Home",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    title: "Ausrüstung",
    href: "/equipment",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Wartung",
    href: "/maintenance",
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    title: "Berichte",
    href: "/reports",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Personal",
    href: "/person-management",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Standorte",
    href: "/locations",
    icon: <Building className="h-5 w-5" />,
  },
  {
    title: "Inventar",
    href: "/inventory",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "Einstellungen",
    href: "/settings",
    icon: <Cog className="h-5 w-5" />,
  },
];

const Sidebar = () => {
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleCollapse = (title: string) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <ScrollArea className="h-full">
      <div className="py-2 px-2 md:px-3">
        <div className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <div key={item.href} className="mb-1">
              {item.subItems ? (
                <Collapsible
                  open={collapsedItems[item.title]}
                  onOpenChange={() => toggleCollapse(item.title)}
                >
                  <CollapsibleTrigger className="w-full focus:outline-none">
                    <div className="flex items-center p-2 rounded-md w-full hover:bg-muted text-muted-foreground hover:text-foreground ">
                      {item.icon}
                      <span className="ml-3 text-sm font-medium">
                        {item.title}
                      </span>
                      <svg
                        className={cn(
                          "ml-auto h-5 w-5 transform transition-transform",
                          collapsedItems[item.title] && "rotate-180"
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1">
                    {item.subItems?.map((subItem) => (
                      <NavLink
                        key={subItem.href}
                        to={subItem.href}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center p-2 rounded-md text-sm hover:bg-muted",
                            isActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground"
                          )
                        }
                      >
                        {subItem.icon}
                        <span className="ml-3">{subItem.title}</span>
                      </NavLink>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center p-2 rounded-md hover:bg-muted",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {item.icon}
                  <span className="ml-3 text-sm font-medium">{item.title}</span>
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default Sidebar;
