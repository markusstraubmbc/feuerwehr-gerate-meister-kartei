
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

export const GlobalSettingsProvider: React.FC<GlobalSettingsProviderProps> = ({
  children,
}) => {
  const { data: settings = {}, isLoading } = useSystemSettings();

  // Apply global settings to the document
  useEffect(() => {
    if (!isLoading && settings) {
      // Apply theme colors
      if (settings.primaryColor) {
        document.documentElement.style.setProperty(
          "--primary",
          settings.primaryColor
        );
      }

      if (settings.secondaryColor) {
        document.documentElement.style.setProperty(
          "--secondary",
          settings.secondaryColor
        );
      }

      // Apply logo
      if (settings.companyLogo) {
        const favicon = document.querySelector(
          'link[rel="icon"]'
        ) as HTMLLinkElement;
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
