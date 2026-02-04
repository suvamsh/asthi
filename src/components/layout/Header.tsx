import { Menu, LogOut, User, Wallet } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  user: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null;
  onMenuClick: () => void;
  onSignOut: () => void;
}

export function Header({ user, onMenuClick, onSignOut }: HeaderProps) {
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-40 bg-[#252526] border-b border-[#3c3c3c]">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#4fc1ff]" />
            <h1 className="text-xl font-bold text-[#e0e0e0]">Asthi</h1>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full border border-[#3c3c3c]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-[#3c3c3c] bg-[#3c3c3c] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#cccccc]" />
                </div>
              )}
              <span className="text-sm text-[#cccccc]">{displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
