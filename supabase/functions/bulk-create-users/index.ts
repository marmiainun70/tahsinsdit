import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { users } = await req.json();
  const results = [];

  for (const u of users) {
    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });

    if (error) {
      results.push({ email: u.email, error: error.message });
      continue;
    }

    const userId = data.user.id;

    // Insert user_role as 'guru'
    await supabase.from("user_roles").insert({ user_id: userId, role: "guru" });

    // Update profile with full_name and role 'guru'
    await supabase.from("profiles").update({ full_name: u.full_name, role: "guru" }).eq("user_id", userId);

    results.push({ email: u.email, success: true });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
