import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/api/supabaseClient';
import type { UserProfile } from '@/types';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setProfile(session?.user?.user_metadata as UserProfile || null);
      }
    );

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setProfile(session?.user?.user_metadata as UserProfile || null);
      setIsLoading(false);
    };

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    profile,
    isLoading,
    async signInWithUsername(username: string, password: string) {
      const { data, error } = await supabase.functions.invoke('login', {
        body: { username, password },
      });

      if (error) throw new Error(error.message);

      const { session: newSession, user: authUser } = data;

      await supabase.auth.setSession(newSession);

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user_metadata.app_user_id)
        .single();

      if (profileError) throw new Error(profileError.message);

      setSession(newSession);
      setProfile(userProfile);
    },
    async signOut() {
      await supabase.auth.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
