import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  text: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navLinks: NavItem[];
  user: { name?: string; email?: string };
  onLogout: () => void;
  isDesktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navLinks, user, onLogout, isDesktopSidebarOpen, toggleDesktopSidebar }) => {
  const getNavLinkClasses = (to: string) => {
    return ({ isActive }: { isActive: boolean }) =>
      `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary'
      } ${!isDesktopSidebarOpen ? 'justify-center' : ''}`;
  };

  return (
    <aside className={`flex flex-col bg-brand-background border-r border-brand-border transition-all duration-300 ${isDesktopSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-brand-border h-16">
          <Link to="/" className={`font-bold text-lg text-brand-primary transition-opacity duration-200 ${!isDesktopSidebarOpen ? 'opacity-0' : ''}`}>
            TournamentApp
          </Link>
          {/* Toggle Button Here */}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={getNavLinkClasses(link.to)}>
            <link.icon className={`h-5 w-5 ${isDesktopSidebarOpen ? 'mr-3' : ''}`} />
            <span className={`transition-opacity duration-200 ${!isDesktopSidebarOpen ? 'opacity-0' : ''}`}>{link.text}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-brand-border">
          <div className={`flex items-center ${!isDesktopSidebarOpen ? 'justify-center' : ''}`}>
              {/* User Avatar Placeholder */}
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <div className={`ml-3 transition-opacity duration-200 ${!isDesktopSidebarOpen ? 'opacity-0' : ''}`}>
                  <p className="text-sm font-medium text-brand-primary">{user.name}</p>
                  <p className="text-xs text-brand-secondary">{user.email}</p>
              </div>
          </div>
          <button onClick={onLogout} className={`w-full mt-4 flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-red-500 hover:bg-red-500/10`}>
              {/* Logout Icon */}
              <span className={`transition-opacity duration-200 ${!isDesktopSidebarOpen ? 'opacity-0' : 'hidden'}`}>Logout</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
