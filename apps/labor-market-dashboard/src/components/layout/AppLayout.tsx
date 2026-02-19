import { useState } from 'react';

import { Sidebar } from './Sidebar';

/** Props for the AppLayout component. */
export interface AppLayoutProps {
  /** Page content rendered by the router */
  children: React.ReactNode;
}

/**
 * Root layout shell with collapsible sidebar and content area.
 *
 * Sidebar state (open/closed) is local UI state -- not stored in the reducer.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggle = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onToggle={handleToggle} />
      <div className="flex flex-1 flex-col overflow-auto">{children}</div>
    </div>
  );
}
