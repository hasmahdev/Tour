import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, Users, Trophy, Sword, BarChart, LogOut } from 'lucide-react';
import Sidebar, { NavItem } from '../ui/Sidebar';
// import { AuthContext } from '../../context/AuthContext'; // This will be created later

const AppShell: React.FC = () => {
  // const { user, logout } = useContext(AuthContext); // Placeholder for auth context
  const navigate = useNavigate();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // This will be replaced with actual user data from context
  const user = { name: 'Dev User', email: 'dev@tournament.app', role: 'developer' };

  const handleLogout = () => {
    // logout();
    navigate('/login');
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
  };

  // Define navigation links based on user role
  const getNavLinks = (role: string): NavItem[] => {
    const allLinks = {
      developer: [
        { to: '/users', text: 'Users', icon: Users },
        { to: '/tournaments', text: 'Tournaments', icon: Trophy },
        { to: '/matches', text: 'Matches', icon: Sword },
        { to: '/standings', text: 'Standings', icon: BarChart },
      ],
      admin: [
        { to: '/users', text: 'Users', icon: Users },
        { to: '/tournaments', text: 'Tournaments', icon: Trophy },
        { to: '/matches', text: 'Matches', icon: Sword },
        { to: '/standings', text: 'Standings', icon: BarChart },
      ],
      user: [
        { to: '/tournaments', text: 'Tournaments', icon: Trophy },
        { to: '/my-matches', text: 'My Matches', icon: Sword },
        { to: '/my-standings', text: 'My Standings', icon: BarChart },
      ],
    };
    return allLinks[role] || [];
  };

  return (
    <div className="flex h-screen bg-brand-background text-brand-primary">
      <Sidebar
        navLinks={getNavLinks(user.role)}
        user={{ name: user.name, email: user.email }}
        onLogout={handleLogout}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        toggleDesktopSidebar={toggleDesktopSidebar}
      />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
