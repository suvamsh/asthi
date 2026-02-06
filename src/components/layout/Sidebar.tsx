import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Newspaper, Wallet, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/assets', icon: Wallet, label: 'Assets' },
  { to: '/assets/add', icon: Plus, label: 'Add Asset' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#252526] border-r border-[#3c3c3c]
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0 md:static md:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c] md:hidden">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#4fc1ff]" />
            <h2 className="text-lg font-bold text-[#e0e0e0]">Asthi</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#37373d] text-[#ffffff]'
                        : 'text-[#cccccc] hover:bg-[#2a2d2e] hover:text-[#ffffff]'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
