import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the service role key to perform admin actions.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2. Verify the JWT from the request to ensure the caller is an authorized admin or developer.
    const { data: { user: callingUser }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    ).auth.getUser();

    if (authError) {
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
        });
    }

    const callerRole = callingUser.user_metadata?.role;
    if (!['developer', 'admin'].includes(callerRole)) {
        return new Response(JSON.stringify({ error: "Permission denied: only developers or admins can create users." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
        });
    }

    // 3. Get the new user's details from the request body.
    const { username, password, full_name, phone, role } = await req.json();
    if (!username || !password || !role) {
      return new Response(JSON.stringify({ error: "Username, password, and role are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 4. Enforce the permission rule: Admins can only create users with the 'user' role.
    if (callerRole === 'admin' && role !== 'user') {
        return new Response(JSON.stringify({ error: "Permission denied: Admins can only create users with the 'user' role." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
        });
    }

    // 5. Call the `create_user` database function to create the user in `public.users`.
    const { data: newUser, error: rpcError } = await supabaseAdmin.rpc('create_user', {
        p_username: username,
        p_password: password,
        p_full_name: full_name,
        p_phone: phone,
        p_role: role
    }).single();

    if (rpcError) {
        // Handle potential unique constraint violation for username
        if (rpcError.message.includes('duplicate key value violates unique constraint')) {
            return new Response(JSON.stringify({ error: "Username already exists." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 409,
            });
        }
        throw new Error(`RPC Error: ${rpcError.message}`);
    }

    // 6. Asynchronously create the corresponding Supabase auth user.
    // This is "fire-and-forget" for the purpose of the response to the client,
    // but we will await it here to ensure it's created before responding.
    // The login function will also handle creating this if it's ever missed.
    const pseudoEmail = `${newUser.id}@internal.tournamentapp`;
    const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: pseudoEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
            app_user_id: newUser.id,
            role: newUser.role,
            full_name: newUser.full_name
        },
    });

    if (createUserError) {
        // If this fails, the user can still log in, and the login function will fix it.
        // Log the error for monitoring.
        console.error(`Failed to create shadow auth user for ${newUser.id}: ${createUserError.message}`);
    }

    // 7. Return the newly created user profile.
    return new Response(JSON.stringify(newUser), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201, // 201 Created
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred", details: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
