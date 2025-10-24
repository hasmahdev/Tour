# Developer Notes: Custom Authentication Architecture

This document explains the custom `username + password` authentication system built for this application and how it integrates with Supabase's native auth.

## Core Concepts

The primary goal is to provide a "password-only" style login experience (which we've implemented as `username + password`) without requiring email confirmations, while still leveraging Supabase's powerful Row-Level Security (RLS) which relies on `auth.uid()`.

To achieve this, we maintain two separate but linked user records:

1.  **`public.users`**: Our canonical source of truth for user profiles. It stores the `username`, `role`, `full_name`, and the securely hashed password (`password_hash`). This is the table our application logic primarily interacts with.
2.  **`auth.users`**: Supabase's internal user table. We create a "shadow" user here for every user in `public.users`. This user record is what Supabase uses to issue JWTs and enforce RLS policies.

## The Authentication Flow

### 1. User Creation (Admin Action)

-   An admin or developer uses the **User Management** UI to create a new user.
-   The frontend calls our custom `create-user` Edge Function.
-   This Edge Function:
    1.  Verifies that the caller is an authorized admin/developer.
    2.  Calls the `create_user` PostgreSQL function, which securely hashes the password and inserts a new record into `public.users`.
    3.  Asynchronously creates a corresponding "shadow" user in `auth.users` using the Supabase Admin API.

### 2. The `auth.users` Shadow Record

-   **Email:** The email for the `auth.users` record is a "pseudo-email" constructed from the `public.users` ID (e.g., `_uuid_@internal.tournamentapp`). This ensures uniqueness and avoids any reliance on real email addresses.
-   **Password:** A secure, random, and unknown password is assigned to the `auth.users` record. **This password is never used for login.**
-   **`user_metadata`:** This is the critical link between the two tables. We store the `app_user_id` (the UUID from `public.users`) and the user's `role` in the `user_metadata` field of the `auth.users` record.

### 3. Login Process

-   The user enters their `username` and `password` on the login page.
-   The frontend sends these credentials to our custom `login` Edge Function.
-   The `login` Edge Function:
    1.  Calls the `find_user_by_username_and_password` PostgreSQL function to verify the credentials against the `public.users` table.
    2.  If valid, it looks up (or creates, if missing) the corresponding shadow user in `auth.users` using the pseudo-email.
    3.  It then uses the Supabase Admin API to generate a valid session (JWT) for that shadow user.
    4.  The session and the user's profile from `public.users` are returned to the client.

### 4. Authenticated Requests & RLS

-   The client receives the session and uses `supabase.auth.setSession()` to store it.
-   From this point on, every request made by the Supabase client is automatically authenticated with the JWT.
-   Our RLS policies can now securely access the `app_user_id` and `role` from the JWT's `user_metadata` to enforce data access rules, effectively linking the secure session to our `public.users` table.

This architecture provides the desired user experience while maintaining a secure and robust integration with Supabase's built-in RLS capabilities.
