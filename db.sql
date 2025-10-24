-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Define all tables for the application

-- Users Table: Stores user profiles, roles, and hashed passwords.
-- Using 'username' for login as decided.
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('developer', 'admin', 'user')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Stores user profiles, roles, and hashed passwords for authentication and identification.';

-- Tournaments Table: Main table for tournament events.
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  photo TEXT, -- URL to image in Supabase Storage
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.tournaments IS 'Represents a single tournament event.';

-- Tournament Users (Participants) Table: Maps users to tournaments.
CREATE TABLE public.tournament_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
COMMENT ON TABLE public.tournament_users IS 'Acts as a join table to link users (participants) to the tournaments they are in.';

-- Matches Table: Stores individual matches within a tournament, including score reporting flow.
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player1_id uuid REFERENCES public.users(id),
  player2_id uuid REFERENCES public.users(id),
  scheduled_at TIMESTAMPTZ,
  score1 INT DEFAULT 0,
  score2 INT DEFAULT 0,
  status TEXT CHECK (status IN ('upcoming', 'ongoing', 'finished')) DEFAULT 'upcoming',
  -- Fields for score reporting and admin approval
  reported_score1 INT,
  reported_score2 INT,
  reporter_id uuid REFERENCES public.users(id),
  report_status TEXT CHECK (report_status IN ('none', 'pending', 'confirmed', 'rejected')) DEFAULT 'none',
  reported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.matches IS 'Details of each match, including players, scores, and the user-reported score approval workflow.';

-- Standings Table: Leaderboard for tournaments.
CREATE TABLE public.standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  rank INT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
COMMENT ON TABLE public.standings IS 'Leaderboard data for each user within a tournament.';

-- Step 3: Add indexes for performance
CREATE INDEX ON public.matches (tournament_id);
CREATE INDEX ON public.tournament_users (tournament_id, user_id);
CREATE INDEX ON public.standings (tournament_id, user_id);

-- Step 4: Create helper functions for user management and authentication

-- Function to create a new user and hash their password.
-- This should be called from a secure, server-side environment (like an Edge Function).
CREATE OR REPLACE FUNCTION public.create_user(
  p_username TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_role TEXT,
  p_password TEXT
) RETURNS public.users AS $$
DECLARE
  new_user public.users%rowtype;
BEGIN
  INSERT INTO public.users (username, full_name, phone, role, password_hash)
  VALUES (p_username, p_full_name, p_phone, p_role, crypt(p_password, gen_salt('bf')))
  RETURNING * INTO new_user;
  RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.create_user IS 'Securely creates a new user with a hashed password. To be used by server-side logic only.';

-- Function to find a user by their username and verify their password.
-- Used by the login Edge Function.
CREATE OR REPLACE FUNCTION public.find_user_by_username_and_password(p_username TEXT, p_password TEXT)
RETURNS SETOF public.users AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.users
  WHERE username = p_username AND crypt(p_password, password_hash) = password_hash;
END;
$$ LANGUAGE plpgsql STABLE;
COMMENT ON FUNCTION public.find_user_by_username_and_password IS 'Finds a user by username and verifies their password. Used for authentication.';

-- Step 5: Implement Row-Level Security (RLS) Policies

-- Helper function to get a value from the user's JWT metadata.
CREATE OR REPLACE FUNCTION auth.get_user_metadata_value(key TEXT)
RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> key, '')::text;
$$ LANGUAGE sql STABLE;

-- 5.1: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;

-- 5.2: Policies for `users` table
CREATE POLICY "Developers can manage all users" ON public.users
  FOR ALL USING (auth.get_user_metadata_value('role') = 'developer');

CREATE POLICY "Admins can manage users with the ''user'' role" ON public.users
  FOR ALL USING (auth.get_user_metadata_value('role') = 'admin' AND role = 'user')
  WITH CHECK (auth.get_user_metadata_value('role') = 'admin' AND role = 'user');

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING ((auth.get_user_metadata_value('app_user_id'))::uuid = id);

-- 5.3: Policies for `tournaments` table
CREATE POLICY "Devs and Admins have full access to tournaments" ON public.tournaments
  FOR ALL USING (auth.get_user_metadata_value('role') IN ('developer', 'admin'));

CREATE POLICY "Authenticated users can view tournaments" ON public.tournaments
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5.4: Policies for `matches` table
CREATE POLICY "Devs and Admins have full access to matches" ON public.matches
  FOR ALL USING (auth.get_user_metadata_value('role') IN ('developer', 'admin'));

CREATE POLICY "Tournament participants can view matches" ON public.matches
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tournament_users tu
    WHERE tu.tournament_id = matches.tournament_id
    AND tu.user_id = (auth.get_user_metadata_value('app_user_id'))::uuid
  ));

CREATE POLICY "Participants can report scores for their own matches" ON public.matches
  FOR UPDATE USING (
    (auth.get_user_metadata_value('app_user_id'))::uuid IN (player1_id, player2_id)
  )
  WITH CHECK (
    -- Users can only update the report status to 'pending' and related fields
    report_status = 'pending'
    AND reporter_id = (auth.get_user_metadata_value('app_user_id'))::uuid
  );

-- 5.5: Policies for `tournament_users` and `standings`
CREATE POLICY "Devs and Admins have full access to participants and standings" ON public.tournament_users
  FOR ALL USING (auth.get_user_metadata_value('role') IN ('developer', 'admin'));

CREATE POLICY "Devs and Admins have full access to standings" ON public.standings
  FOR ALL USING (auth.get_user_metadata_value('role') IN ('developer', 'admin'));

CREATE POLICY "Authenticated users can view participant and standings data" ON public.tournament_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view standings" ON public.standings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Force RLS for table owners (best practice)
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.matches FORCE ROW LEVEL SECURITY;
ALTER TABLE public.standings FORCE ROW LEVEL SECURITY;
