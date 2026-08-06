import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const email = "ysds@app.local";
  const password = "ysds123";
  const fullName = "YSDS";
  const username = "ysds";

  let userId: string | null = null;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username, role: "guru" },
  });

  if (createErr) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = list?.users?.find((u) => u.email === email);
    if (!found) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    userId = found.id;
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    userId = created.user!.id;
  }

  await admin.from("profiles").upsert(
    {
      user_id: userId,
      full_name: fullName,
      username,
      role: "admin",
      status: "approved",
      is_read_by_admin: true,
    },
    { onConflict: "user_id" },
  );

  await admin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" },
  );

  return new Response(JSON.stringify({ ok: true, user_id: userId, email }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
