
import React, { createContext, useContext, useEffect } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface GlobalSettingsContextType {
  settings: { [key: string]: any };
  isLoading: boolean;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType>({
  settings: {},
  isLoading: true,
});

export const useGlobalSettings = () => {
  return useContext(GlobalSettingsContext);
};

interface GlobalSettingsProviderProps {
  children: React.ReactNode;
}

export const GlobalSettingsProvider = ({ children }: GlobalSettingsProviderProps) => {
  const { data: settings = {}, isLoading } = useSystemSettings();

  // Apply global settings to the document
  useEffect(() => {
    if (!isLoading && settings) {
      // Apply theme colors to CSS custom properties
      const root = document.documentElement;
      
      if (settings.menuBackgroundColor) {
        root.style.setProperty('--sidebar-background', settings.menuBackgroundColor);
      }

      if (settings.menuTextColor) {
        root.style.setProperty('--sidebar-foreground', settings.menuTextColor);
      }

      if (settings.menuSelectedColor) {
        root.style.setProperty('--sidebar-accent', settings.menuSelectedColor);
        root.style.setProperty('--sidebar-accent-foreground', '#ffffff');
      }

      // Apply legacy CSS variables for backward compatibility
      if (settings.primaryColor) {
        root.style.setProperty('--primary', settings.primaryColor);
      }

      if (settings.secondaryColor) {
        root.style.setProperty('--secondary', settings.secondaryColor);
      }

      // Apply logo as favicon
      if (settings.companyLogo) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = settings.companyLogo;
        }
      }

      // Apply company name to document title
      if (settings.companyName) {
        document.title = `${settings.companyName} - Inventar System`;
      }
    }
  }, [settings, isLoading]);

  return (
    <GlobalSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};
