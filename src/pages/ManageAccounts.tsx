import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel } from "@/lib/roleLabels";

type AccountRow = {
  user_id: string;
  full_name: string;
  username: string | null;
  whatsapp: string | null;
  role: string;
  status: "pending" | "approved" | "rejected" | "inactive";
  registered_at: string;
};

type ParentStudentRow = {
  user_id: string;
  students: {
    nama: string;
    kelas: number;
    rombel: string;
  } | {
    nama: string;
    kelas: number;
    rombel: string;
  }[] | null;
};

export default function ManageAccounts() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === "admin";
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["managed-accounts"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,full_name,username,whatsapp,role,status,registered_at")
        .order("registered_at", { ascending: false });
      if (error) throw error;

      const { data: parentStudents, error: parentStudentsError } = await supabase
        .from("parents")
        .select("user_id,students(nama,kelas,rombel)");
      if (parentStudentsError) throw parentStudentsError;

      const childrenByParent = new Map<string, string[]>();
      for (const link of (parentStudents || []) as ParentStudentRow[]) {
        const student = Array.isArray(link.students) ? link.students[0] : link.students;
        if (!student) continue;
        const children = childrenByParent.get(link.user_id) || [];
        children.push(`${student.nama} (${student.kelas}${student.rombel})`);
        childrenByParent.set(link.user_id, children);
      }

      return (data as AccountRow[]).map((account) => ({
        ...account,
        children: childrenByParent.get(account.user_id) || [],
      }));
    },
  });

  const updateStatus = async (userId: string, status: AccountRow["status"]) => {
    if (userId === user?.id) {
      setActionError("Status akun admin yang sedang digunakan tidak dapat diubah dari halaman ini.");
      return;
    }

    setActionError("");
    setUpdatingUserId(userId);
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);

    if (error) {
      setActionError(error.message);
      setUpdatingUserId(null);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    setUpdatingUserId(null);
  };

  if (!isAdmin) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses admin.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Persetujuan Akun</h1>
        <p className="text-sm text-muted-foreground">Tinjau akun guru dan orang tua yang mendaftar dari halaman publik.</p>
      </div>

      {actionError && (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p>
      )}

      <div className="grid gap-4">
        {accounts.map((account) => {
          const isUpdating = updatingUserId === account.user_id;
          const isCurrentAdmin = account.user_id === user?.id;

          return (
            <article key={account.user_id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-foreground">{account.full_name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      account.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : account.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}>
                      {account.status}
                    </span>
                    {isCurrentAdmin && (
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        Akun Anda
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    @{account.username || "-"} · {account.whatsapp || "WhatsApp belum diisi"} · {getRoleLabel(account.role)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mendaftar {new Date(account.registered_at).toLocaleString("id-ID")}
                  </p>
                  {account.role === "parent" && (
                    <div className="mt-3 rounded-xl bg-secondary/60 p-3">
                      <p className="text-xs font-semibold text-foreground">Anak yang diverifikasi</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {account.children.length > 0 ? account.children.join(", ") : "Data anak tidak ditemukan"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={isUpdating || isCurrentAdmin}
                    onClick={() => updateStatus(account.user_id, "approved")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Setujui
                  </button>
                  <button
                    disabled={isUpdating || isCurrentAdmin}
                    onClick={() => updateStatus(account.user_id, "rejected")}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" /> Tolak
                  </button>
                  <button
                    disabled={isUpdating || isCurrentAdmin}
                    onClick={() => updateStatus(account.user_id, "inactive")}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" /> Nonaktifkan
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {accounts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Belum ada akun yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
}
