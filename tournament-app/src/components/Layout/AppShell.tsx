import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/ui/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

const AppShell = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading || !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-background text-brand-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
