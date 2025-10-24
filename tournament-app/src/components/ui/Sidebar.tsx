import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, ShieldCheck, Trophy, Users, Award, Shield, Swords } from 'lucide-react';
import { Spinner } from './Spinner';

// New, more modular components
const SidebarLink = ({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-4 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-brand-secondary hover:bg-brand-surface hover:text-brand-primary'
      }`
    }
  >
    {icon}
    <span className="truncate">{children}</span>
  </NavLink>
);

const UserMenu = () => {
  const { profile, session, signOut } = useAuth();
  if (!session || !profile) return null;

  return (
    <div className="mt-auto p-4 bg-brand-surface rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 truncate">
          <p className="text-sm font-semibold text-brand-primary truncate">{profile.full_name}</p>
          <p className="text-xs text-brand-secondary truncate">{profile.role}</p>
        </div>
        <button onClick={signOut} className="text-brand-secondary hover:text-brand-primary transition-colors">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

// Main Sidebar Component
const Sidebar = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <aside className="w-64 flex flex-col bg-brand-background border-r border-brand-border p-4">
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </aside>
    );
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'developer';
  const isUser = profile?.role === 'user';

  return (
    <aside className="w-64 flex flex-col bg-brand-background border-r border-brand-border p-4 gap-2">
      <div className="flex items-center gap-3 mb-6 p-2">
        <Trophy className="w-8 h-8 text-indigo-600" />
        <h1 className="text-xl font-bold text-brand-primary">TournamentApp</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {isAdmin && (
          <>
            <SidebarLink to="/tournaments" icon={<Award size={20} />}>Tournaments</SidebarLink>
            <SidebarLink to="/matches" icon={<Swords size={20} />}>Matches</SidebarLink>
            <SidebarLink to="/users" icon={<Users size={20} />}>User Management</SidebarLink>
            <SidebarLink to="/score-approval" icon={<ShieldCheck size={20} />}>Score Approval</SidebarLink>
          </>
        )}
        {isUser && (
          <>
            <SidebarLink to="/user/tournaments" icon={<Trophy size={20} />}>Tournaments</SidebarLink>
            <SidebarLink to="/my-matches" icon={<Shield size={20} />}>My Matches</SidebarLink>
          </>
        )}
      </nav>

      <UserMenu />
    </aside>
  );
};

export default Sidebar;
