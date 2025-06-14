
import React from "react";
import { GlobalSettingsProvider } from "./GlobalSettingsProvider";

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  return (
    <GlobalSettingsProvider>
      {children}
    </GlobalSettingsProvider>
  );
};
