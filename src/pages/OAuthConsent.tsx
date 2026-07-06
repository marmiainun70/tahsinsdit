import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; logo_uri?: string | null };
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};

// Minimal typed wrapper for the beta supabase.auth.oauth namespace.
type OauthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function getOauth(): OauthApi | null {
  const anyAuth = supabase.auth as unknown as { oauth?: OauthApi };
  return anyAuth.oauth ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const oauth = getOauth();
      if (!oauth) return setError("OAuth authorization is not available in this build of Supabase auth.");

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const oauth = getOauth();
    if (!oauth) return setError("OAuth authorization is not available.");
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border bg-card p-6 shadow">
          <h1 className="text-lg font-semibold text-foreground">Tidak dapat memuat permintaan otorisasi</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }
  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat izin akses...</p>
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "Aplikasi eksternal";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-2xl border bg-card p-6 shadow space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Izinkan {clientName}?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clientName} meminta akses untuk memakai Tahsin SDIT sebagai Anda melalui MCP.
            Alat yang dijalankan akan bekerja dengan izin dan data yang sama seperti akun Anda.
          </p>
        </div>
        {details.scopes && details.scopes.length > 0 && (
          <ul className="text-sm text-muted-foreground list-disc pl-5">
            {details.scopes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="h-10 px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Tolak
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-105 disabled:opacity-60"
          >
            {busy ? "Memproses..." : "Izinkan"}
          </button>
        </div>
      </div>
    </main>
  );
}
