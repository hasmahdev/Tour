import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import AppShell from './components/Layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';

// Page components
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/Admin/UserManagement';
import TournamentManagement from './pages/Admin/TournamentManagement';
import MatchManagement from './pages/Admin/MatchManagement';
import ScoreApprovalPage from './pages/Admin/ScoreApprovalPage';
import UserTournamentsPage from './pages/User/TournamentsPage';
import MyMatchesPage from './pages/User/MyMatchesPage';


const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/tournaments" replace />} />

              {/* Admin & Developer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['developer', 'admin']} />}>
                <Route path="users" element={<UserManagement />} />
                <Route path="matches" element={<MatchManagement />} />
                <Route path="score-approval" element={<ScoreApprovalPage />} />
                <Route path="tournaments" element={<TournamentManagement />} />
              </Route>

              {/* User Routes */}
              <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                <Route path="user/tournaments" element={<UserTournamentsPage />} />
                <Route path="my-matches" element={<MyMatchesPage />} />
              </Route>
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/tournaments" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
