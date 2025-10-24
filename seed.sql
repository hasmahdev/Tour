-- This script seeds the database with an initial developer account.
-- You can run this in the Supabase SQL Editor after running `db.sql`.

-- The `create_user` function handles password hashing automatically.
-- This creates a user with:
--   Username: dev
--   Password: devpassword

SELECT public.create_user(
  'dev',
  'Default Developer',
  'N/A',
  'developer',
  'devpassword'
);
