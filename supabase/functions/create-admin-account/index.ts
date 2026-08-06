import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERNAME = "ysds";
const PASSWORD = "ysds123";
const FALLBACK_EMAIL = "ysds@ysds.local";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const steps: unknown[] = [];
  let userId: string | null = null;
  let email: string | null = null;

  // 1. Existing profile with this username?
  const { data: prof } = await admin
    .from("profiles")
    .select("user_id")
    .eq("username", USERNAME)
    .maybeSingle();

  if (prof?.user_id) {
    userId = prof.user_id;
    const { data: got } = await admin.auth.admin.getUserById(userId);
    email = got?.user?.email ?? null;
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
    });
    steps.push({ reused_existing: true, update_error: updErr?.message ?? null });
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: FALLBACK_EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "YSDS Admin", username: USERNAME, role: "guru" },
    });
    if (createErr) {
      steps.push({ create_error: createErr.message });
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find((u) => u.email === FALLBACK_EMAIL);
      if (!found) {
        return new Response(JSON.stringify({ error: createErr.message, steps }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      userId = found.id;
      email = found.email ?? null;
      await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true });
    } else {
      userId = created.user!.id;
      email = created.user!.email ?? null;
    }
  }

  const { error: profErr } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: "YSDS Admin",
        username: USERNAME,
        role: "admin",
        status: "approved",
        is_read_by_admin: true,
      },
      { onConflict: "user_id" },
    );
  steps.push({ profile_error: profErr?.message ?? null });

  const { error: roleErr } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  steps.push({ role_error: roleErr?.message ?? null });

  return new Response(JSON.stringify({ ok: true, user_id: userId, email, steps }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
