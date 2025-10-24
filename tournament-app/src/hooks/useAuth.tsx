import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import { login as apiLogin, logout as apiLogout, UserProfile } from '../api/auth';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch the session on initial load
  const { data: initialSession, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session);
      return data.session;
    },
    staleTime: Infinity,
    retry: false,
  });

  // Handle auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // When auth state changes, refetch the profile
      if (session) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        setProfile(null);
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [queryClient]);

  // Fetch user profile when session is available
  const { data: userProfile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.user_metadata.app_user_id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.user_metadata.app_user_id)
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    },
    enabled: !!session,
  });


  const loginMutation = useMutation({
    mutationFn: ({ username, password }: {username: string, password:string}) => apiLogin(username, password),
    onSuccess: (user) => {
      setProfile(user);
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => {
      setSession(null);
      setProfile(null);
      queryClient.clear();
    },
  });

  const value = {
    session,
    user: session?.user || null,
    profile,
    login: async (username, password) => {
      await loginMutation.mutateAsync({ username, password });
    },
    logout: () => {
      logoutMutation.mutate();
    },
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
