import { supabase } from './supabaseClient';

// Type definition for the user profile stored in our public.users table
export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: 'developer' | 'admin' | 'user';
}

// Type definition for the successful login response from our Edge Function
interface LoginResponse {
  session: {
    access_token: string;
    refresh_token: string;
  };
  user: UserProfile;
}

/**
 * Logs in a user using their username and password by calling the custom 'login' Edge Function.
 * @param username The user's username.
 * @param password The user's password.
 * @returns The user's profile information.
 */
export async function login(username: string, password: string): Promise<UserProfile> {
  const { data, error } = await supabase.functions.invoke('login', {
    body: { username, password },
  });

  if (error) {
    throw new Error(error.message);
  }

  const loginData = data as LoginResponse;

  // Set the session in the Supabase client library to manage auth state
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: loginData.session.access_token,
    refresh_token: loginData.session.refresh_token,
  });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return loginData.user;
}

/**
 * Logs the current user out.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
