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

  // Ref untuk mencegah fetchProfile dijalankan berulang / concurrent
  const fetchingRef = useRef(false);
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
  const fetchAndVerifyProfile = async (userId: string): Promise<boolean> => {
    if (fetchingRef.current) return false;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("user_id", userId)
        .single();

      // Fail closed: jika error DB, tolak akses
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
    } finally {
      fetchingRef.current = false;
    }
  };

  // ─── Paksa keluar jika status bukan approved ─────────────────────────────
  const enforceSignOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    signingOutRef.current = false;
  };

  // ─── Auth State Listener ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        if (!newSession?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAccountStatus(null);
          setLoading(false);
          return;
        }

        setSession(newSession);
        setUser(newSession.user);

        const approved = await fetchAndVerifyProfile(newSession.user.id);
        if (!approved && mounted) {
          await enforceSignOut();
        }

        if (mounted) setLoading(false);
      }
    );

    // Cek session yang sudah ada saat pertama kali load
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;

      if (!existingSession?.user) {
        setLoading(false);
        return;
      }

      setSession(existingSession);
      setUser(existingSession.user);

      const approved = await fetchAndVerifyProfile(existingSession.user.id);
      if (!approved && mounted) {
        await enforceSignOut();
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── signIn ──────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    clearAuthError();

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return {
        success: false,
        type: "credentials",
        message: "Email atau password salah. Silakan coba lagi.",
      };
    }

    // Setelah signInWithPassword berhasil, onAuthStateChange akan terpicu
    // dan fetchAndVerifyProfile akan berjalan.
    // Untuk signIn, kita ambil session saat ini dan verifikasi langsung.
    const { data: { session: newSession } } = await supabase.auth.getSession();
    if (!newSession?.user) {
      return {
        success: false,
        type: "unknown",
        message: "Gagal mendapatkan sesi. Silakan coba lagi.",
      };
    }

    // Ambil profile untuk verifikasi status
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role, status")
      .eq("user_id", newSession.user.id)
      .single();

    if (profileError || !profileData) {
      await enforceSignOut();
      const msg = PROFILE_MISSING_MESSAGE;
      persistAuthError(msg);
      return { success: false, type: "profile_missing", message: msg };
    }

    const status = (profileData.status as AccountStatus) ?? "approved";

    if (status !== "approved") {
      await enforceSignOut();
      const msg = getStatusMessage(status);
      persistAuthError(msg);
      return { success: false, type: status, message: msg };
    }

    // Status approved — bersihkan error lama
    persistAuthError(null);
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
