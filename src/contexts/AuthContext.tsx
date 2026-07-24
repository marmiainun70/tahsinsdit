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
  const fetchAndVerifyProfile = async (userId: string): Promise<boolean> => {
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      // Graceful fallback: Jika gagal karena kolom 'status' belum ada di live DB
      // (karena frontend di-deploy sebelum migration backend)
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

      // Fail closed: jika masih error DB atau data kosong, tolak akses
      if (error || !data) {
        persistAuthError(PROFILE_MISSING_MESSAGE);
        setProfile(null);
        setAccountStatus(null);
        return false;
      }

      const status = (data.status as AccountStatus) ?? "approved";
      setAccountStatus(status);

      if (status !== "approved") {
        // Simpan pesan SEBELUM signOut agar tidak hilang
        persistAuthError(getStatusMessage(status));
        setProfile(null);
        return false; // caller akan trigger signOut
      }

      setProfile({
        full_name: data.full_name,
        role: data.role,
        status,
      });
      return true;
    } catch {
      persistAuthError(PROFILE_MISSING_MESSAGE);
      setProfile(null);
      setAccountStatus(null);
      return false;
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
  // Supabase JS v2: callback onAuthStateChange harus selesai secara sinkron.
  // Query Supabase lain dijalankan setelah callback selesai agar auth client
  // tidak terkunci saat profile sedang diverifikasi.
  useEffect(() => {
    let mounted = true;
    let verificationId = 0;

    const verifySession = async (newSession: Session, currentVerificationId: number) => {
      try {
        const approved = await fetchAndVerifyProfile(newSession.user.id);

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
