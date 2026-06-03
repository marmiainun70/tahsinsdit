import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Verify admin role
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { title, body, audience, link } = await req.json();
    if (!title || !body) return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Resolve target user_ids
    let targetIds: string[] = [];
    if (audience === "guru" || audience === "wali") {
      const role = audience === "guru" ? "guru" : "wali_murid";
      const { data: ur } = await admin.from("user_roles").select("user_id").eq("role", role);
      targetIds = (ur ?? []).map((r: any) => r.user_id);
    } else {
      const { data: ur } = await admin.from("user_roles").select("user_id");
      targetIds = Array.from(new Set((ur ?? []).map((r: any) => r.user_id)));
    }
    if (targetIds.length === 0) return new Response(JSON.stringify({ sent: 0, inbox: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Filter by preference
    const { data: prefs } = await admin.from("notification_preferences").select("user_id, announcement").in("user_id", targetIds);
    const blocked = new Set((prefs ?? []).filter((p: any) => p.announcement === false).map((p: any) => p.user_id));
    const allowed = targetIds.filter((id) => !blocked.has(id));

    // Insert inbox rows
    const rows = allowed.map((uid) => ({ user_id: uid, type: "announcement", title, body, link: link ?? null, metadata: {} }));
    if (rows.length) await admin.from("notifications").insert(rows);

    // Send push
    const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", allowed);
    const payload = JSON.stringify({ title, body, link: link ?? "/", metadata: { type: "announcement" } });
    let sent = 0; const expired: string[] = [];
    await Promise.all((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.endpoint);
      }
    }));
    if (expired.length) await admin.from("push_subscriptions").delete().in("endpoint", expired);

    return new Response(JSON.stringify({ inbox: rows.length, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
