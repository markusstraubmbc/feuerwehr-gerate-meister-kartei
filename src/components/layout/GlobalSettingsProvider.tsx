import React, { createContext, useContext, useEffect } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useQueryClient } from "@tanstack/react-query";

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
  // Check that we are inside a QueryClientProvider (react-query context)
  let queryClient = null;
  try {
    queryClient = useQueryClient();
  } catch (e) {
    if (typeof window !== "undefined") {
      // Clear error overlay, then log a helpful error
      // @ts-ignore
      if (window?.$RefreshReg$) window.$RefreshReg$ = () => {};
      // eslint-disable-next-line
      console.error(
        "GlobalSettingsProvider must be used inside a <QueryClientProvider>. " +
        "Please ensure that your component tree wraps everything in QueryClientProvider at the top level. " +
        "React Query hooks will not work properly outside its context. Error:", e
      );
    }
    // Optionally throw, or fallback to a default context state
    return <>{children}</>;
  }

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
