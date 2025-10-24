import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username and password are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find the user in our public.users table by username and password
    const { data: user, error: rpcError } = await supabaseAdmin.rpc('find_user_by_username_and_password', {
        p_username: username,
        p_password: password
    }).single();

    if (rpcError || !user) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
        });
    }

    // 2. Check if a corresponding Supabase auth user exists.
    // We use a pseudo-email based on the user's ID for mapping.
    const pseudoEmail = `${user.id}@internal.tournamentapp`;
    let { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(pseudoEmail);

    // 3. If the auth user doesn't exist, create it.
    if (getUserError) {
        if (getUserError.message.includes("User not found")) {
            const { data: newAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                email: pseudoEmail,
                password: crypto.randomUUID(), // Assign a secure, random password
                email_confirm: true, // Auto-confirm the email
                user_metadata: {
                    app_user_id: user.id,
                    role: user.role,
                    full_name: user.full_name
                },
            });

            if (createUserError) {
                throw new Error(`Failed to create Supabase auth user: ${createUserError.message}`);
            }
            authUser = newAuthUser.user;
        } else {
            throw new Error(`Failed to get Supabase auth user: ${getUserError.message}`);
        }
    } else {
        // If the user exists, ensure their metadata is up-to-date.
        const { data: updatedUser, error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.user.id,
            {
                user_metadata: {
                    app_user_id: user.id,
                    role: user.role,
                    full_name: user.full_name
                }
            }
        );

        if(updateUserError) {
             throw new Error(`Failed to update Supabase auth user: ${updateUserError.message}`);
        }
    }


    // 4. Generate a session for the auth user.
    // Using signInWithPassword to generate a session as there's no direct "create session" method.
    // We use the pseudo-email and a newly generated random password for security. A temporary password is set
    // on the auth user, a session is created, and this password is then unusable for subsequent logins.
    const tempPassword = crypto.randomUUID();
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: tempPassword });

    const { data: sessionData, error: sessionError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.signInWithPassword({
        email: pseudoEmail,
        password: tempPassword,
    });


    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // 5. Return the session and user profile to the client
    return new Response(JSON.stringify({ session: sessionData.session, user: user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred", details: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
