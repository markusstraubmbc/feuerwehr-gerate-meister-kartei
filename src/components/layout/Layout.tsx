
import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
