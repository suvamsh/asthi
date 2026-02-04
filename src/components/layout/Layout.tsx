import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  user: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null;
  onSignOut: () => void;
  children: ReactNode;
}

export function Layout({ user, onSignOut, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <Header
        user={user}
        onMenuClick={() => setSidebarOpen(true)}
        onSignOut={onSignOut}
      />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
