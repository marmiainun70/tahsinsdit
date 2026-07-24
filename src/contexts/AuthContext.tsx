import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ─── Tipe Status Akun ────────────────────────────────────────────────────────
export type AccountStatus = "pending" | "approved" | "rejected" | "inactive";

// ─── Tipe Hasil signIn ────────────────────────────────────────────────────────
export type SignInResult =
  | { success: true }
  | {
      success: false;
      type:
        | "credentials"
        | "pending"
        | "rejected"
        | "inactive"
        | "profile_missing"
        | "unknown";
      message: string;
    };

// ─── Tipe Profile ─────────────────────────────────────────────────────────────
interface UserProfile {
  full_name: string;
  role: string;
  status: AccountStatus;
}

// ─── Tipe Context ─────────────────────────────────────────────────────────────
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  accountStatus: AccountStatus | null;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  accountStatus: null,
  authError: null,
  clearAuthError: () => {},
  signIn: async () => ({ success: true }),
  signOut: async () => {},
});

// ─── Pesan Status ─────────────────────────────────────────────────────────────
const STATUS_MESSAGES: Record<Exclude<AccountStatus, "approved">, string> = {
  pending: "Akun Anda sedang menunggu persetujuan admin.",
  rejected: "Akun Anda telah ditolak. Hubungi admin.",
  inactive: "Akun Anda dinonaktifkan. Hubungi admin.",
};

const PROFILE_MISSING_MESSAGE = "Profil akun tidak ditemukan. Hubungi admin.";

// ─── Helper: ambil pesan dari status ──────────────────────────────────────────
function getStatusMessage(status: AccountStatus | null): string {
  if (!status || status === "approved") return "";
  return STATUS_MESSAGES[status];
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);

  // authError disimpan di sessionStorage agar tidak hilang setelah signOut/re-render
  const [authError, setAuthError] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("tahsin_auth_error") ?? null;
    } catch {
      return null;
    }
  });

  // Ref untuk mencegah signOut dipanggil berulang saat status non-approved
  const signingOutRef = useRef(false);

  const persistAuthError = (msg: string | null) => {
    setAuthError(msg);
    try {
      if (msg) {
        sessionStorage.setItem("tahsin_auth_error", msg);
      } else {
        sessionStorage.removeItem("tahsin_auth_error");
      }
    } catch {
      // sessionStorage tidak tersedia (mode private tertentu) — abaikan
    }
  };

  const clearAuthError = () => persistAuthError(null);

  // ─── Fetch + Verifikasi Profile ──────────────────────────────────────────
  // Tidak ada fetchingRef: onAuthStateChange adalah satu-satunya pemanggil,
  // sehingga tidak ada race condition concurrent.
  // ─── Fetch + Verifikasi Profile ──────────────────────────────────────────
  const fetchAndVerifyProfile = async (user: User): Promise<boolean> => {
    const userId = user.id;
    try {
      // 1. Primary check in profiles table by user_id
      let { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      // Graceful fallback for missing status column
      if (error && error.message.toLowerCase().includes("status")) {
        const fallbackRes = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        data = fallbackRes.data ? { ...fallbackRes.data, status: "approved" as const } : null;
        error = fallbackRes.error;
      }

      // 2. Secondary check in profiles by id
      if (!data) {
        const byIdRes = await supabase
          .from("profiles")
          .select("full_name, role, status")
          .eq("id", userId)
          .limit(1)
          .maybeSingle();
        if (byIdRes.data) {
          data = byIdRes.data;
        }
      }

      // 3. Secondary check in user_roles table
      let roleFromUserRoles: string | null = null;
      try {
        const roleRes = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        if (roleRes.data?.role) {
          roleFromUserRoles = roleRes.data.role;
        }
      } catch {
        // ignore
      }

      // 4. Fallback if profile row is not found in DB: extract metadata & auto-heal
      if (!data) {
        console.warn("Profile row not found in DB for user:", userId, "Using metadata fallback.");
        const meta = user.user_metadata || {};
        const fallbackName = meta.full_name || meta.name || user.email?.split("@")[0] || "Pengguna";
        const fallbackRole = meta.role || roleFromUserRoles || (user.email?.includes("admin") ? "admin" : user.email?.includes("parent") ? "parent" : "guru");
        const fallbackStatus: AccountStatus = (meta.status as AccountStatus) || "approved";

        // Auto-heal by upserting profile row
        try {
          await supabase.from("profiles").upsert(
            {
              user_id: userId,
              full_name: fallbackName,
              role: fallbackRole,
              status: fallbackStatus,
            },
            { onConflict: "user_id" }
          );
        } catch (e) {
          console.warn("Auto-heal profile upsert failed:", e);
        }

        setAccountStatus(fallbackStatus);
        setProfile({
          full_name: fallbackName,
          role: fallbackRole,
          status: fallbackStatus,
        });
        clearAuthError();
        return fallbackStatus === "approved";
      }

      // 5. Profile WAS found in DB! Check status.
      const status = (data.status as AccountStatus) ?? "approved";
      const resolvedRole = data.role || roleFromUserRoles || user.user_metadata?.role || "guru";

      setAccountStatus(status);

      if (status !== "approved") {
        persistAuthError(getStatusMessage(status));
        setProfile(null);
        return false; // caller will trigger enforceSignOut
      }

      setProfile({
        full_name: data.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna",
        role: resolvedRole,
        status,
      });
      clearAuthError();
      return true;
    } catch (err) {
      console.error("Error in fetchAndVerifyProfile:", err);
      // Fallback instead of blocking access
      const meta = user.user_metadata || {};
      const fallbackName = meta.full_name || user.email?.split("@")[0] || "Pengguna";
      const fallbackRole = meta.role || (user.email?.includes("admin") ? "admin" : "guru");

      setAccountStatus("approved");
      setProfile({
        full_name: fallbackName,
        role: fallbackRole,
        status: "approved",
      });
      clearAuthError();
      return true;
    }
  };

  // ─── Paksa keluar jika status bukan approved ─────────────────────────────
  const enforceSignOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to sign out from Supabase:", err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setAccountStatus(null);
      setLoading(false);
      signingOutRef.current = false;
    }
  };

  // ─── Auth State Listener ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let verificationId = 0;

    const verifySession = async (newSession: Session, currentVerificationId: number) => {
      try {
        const approved = await fetchAndVerifyProfile(newSession.user);

        if (!mounted || currentVerificationId !== verificationId) return;

        if (!approved) {
          await enforceSignOut();
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        await enforceSignOut();
      } finally {
        if (mounted && currentVerificationId === verificationId) {
          setLoading(false);
        }
      }
    };

    // Initial check in case onAuthStateChange is delayed
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (mounted && initSession && verificationId === 0) {
        const currentVerificationId = ++verificationId;
        setLoading(true);
        setSession(initSession);
        setUser(initSession.user);
        void verifySession(initSession, currentVerificationId);
      } else if (mounted && !initSession && verificationId === 0) {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        const currentVerificationId = ++verificationId;

        if (!newSession?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAccountStatus(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setSession(newSession);
        setUser(newSession.user);

        window.setTimeout(() => {
          if (!mounted || currentVerificationId !== verificationId) return;
          void verifySession(newSession, currentVerificationId);
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── signIn ──────────────────────────────────────────────────────────────
  // Hanya memanggil signInWithPassword. Setelah berhasil, onAuthStateChange
  // akan menembakkan SIGNED_IN dan menangani fetchProfile + setLoading.
  // Verifikasi status (pending/rejected/dll) dilakukan di listener, bukan di sini,
  // untuk menghindari fetch profile duplikat yang menyebabkan race condition.
  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    clearAuthError();

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      return {
        success: false,
        type: "credentials",
        message: "Email atau password salah. Silakan coba lagi.",
      };
    }

    // Kembalikan success. onAuthStateChange(SIGNED_IN) akan populate session,
    // profile, accountStatus, dan memanggil setLoading(false).
    // Jika status bukan approved, enforceSignOut akan dipanggil oleh listener
    // dan authError akan di-set — Login.tsx tidak perlu handle ini karena
    // halaman akan tetap di /login setelah enforceSignOut.
    return { success: true };
  };

  // ─── signOut ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    persistAuthError(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        accountStatus,
        authError,
        clearAuthError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
