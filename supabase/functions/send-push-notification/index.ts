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

    const { user_ids, title, body, link, type, metadata } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0 || !title) {
      return new Response(JSON.stringify({ error: "user_ids and title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter user_ids based on preference for the given type
    let allowedIds = user_ids as string[];
    if (type) {
      const { data: prefs } = await admin.from("notification_preferences").select("user_id, " + type).in("user_id", user_ids);
      const blocked = new Set((prefs ?? []).filter((p: any) => p[type] === false).map((p: any) => p.user_id));
      allowedIds = user_ids.filter((id: string) => !blocked.has(id));
    }
    if (allowedIds.length === 0) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", allowedIds);

    const payload = JSON.stringify({ title, body: body ?? "", link: link ?? "/", metadata: metadata ?? {} });
    let sent = 0, failed = 0;
    const expired: string[] = [];
    await Promise.all((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err: any) {
        failed++;
        if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.endpoint);
      }
    }));
    if (expired.length) await admin.from("push_subscriptions").delete().in("endpoint", expired);

    return new Response(JSON.stringify({ sent, failed, expired: expired.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
