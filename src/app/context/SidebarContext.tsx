'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to false so server render matches initial client render to avoid hydration mismatches.
  const [isCollapsed, setIsCollapsed] = useState(false);

  // On mount, read persisted preference once and apply it. Doing this in an effect ensures
  // the value isn't read during server-side render and avoids content differences between
  // server and client that lead to hydration errors.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'boolean') setIsCollapsed(parsed);
      }
    } catch (e) {
      console.error('Failed to read sidebar collapsed state:', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const sidebarWidth = isCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
