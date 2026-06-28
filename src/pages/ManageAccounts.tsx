import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, UserX, Search, Filter, X, SearchX, MessageSquare, Copy, Check, Edit2, Save } from "lucide-react";
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

type AccountWithChildren = AccountRow & { children: string[] };

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
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [recentUpdatedAccount, setRecentUpdatedAccount] = useState<AccountWithChildren | null>(null);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", username: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

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

    let confirmMsg = "";
    if (status === "approved") confirmMsg = "Setujui akun ini?";
    else if (status === "rejected") confirmMsg = "Yakin ingin menolak akun ini?";
    else if (status === "inactive") confirmMsg = "Yakin ingin menonaktifkan akun ini?";

    if (confirmMsg && !window.confirm(confirmMsg)) {
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

    const updatedAccount = accounts.find(a => a.user_id === userId);
    if (updatedAccount) {
      setRecentUpdatedAccount({ ...updatedAccount, status } as AccountWithChildren);
    }

    await queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    setUpdatingUserId(null);
  };

  const handleEditSave = async (userId: string) => {
    setActionError("");
    setIsSavingEdit(true);
    const { error } = await supabase.from("profiles").update({ 
      full_name: editForm.full_name, 
      username: editForm.username || null 
    }).eq("user_id", userId);

    if (error) {
      setActionError("Gagal memperbarui profil: " + error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
      setEditingUserId(null);
    }
    setIsSavingEdit(false);
  };

  const stats = useMemo(() => {
    return accounts.reduce(
      (acc, curr) => {
        if (curr.status === "pending") acc.pending++;
        else if (curr.status === "approved") acc.approved++;
        else if (curr.status === "rejected") acc.rejected++;
        else if (curr.status === "inactive") acc.inactive++;

        if (curr.role === "teacher") acc.teacher++;
        else if (curr.role === "parent") acc.parent++;

        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, inactive: 0, teacher: 0, parent: 0 }
    );
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const matchesSearch =
          searchQuery === "" ||
          acc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (acc.username && acc.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (acc.whatsapp && acc.whatsapp.includes(searchQuery));
        
        const matchesStatus = statusFilter === "all" || acc.status === statusFilter;
        const matchesRole = roleFilter === "all" || acc.role === roleFilter;

        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => {
        // Sort pending first
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        // Then by registered_at desc
        return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime();
      });
  }, [accounts, searchQuery, statusFilter, roleFilter]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || roleFilter !== "all";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRoleFilter("all");
  };

  const pendingAccounts = filteredAccounts.filter(acc => acc.status === "pending" && acc.user_id !== user?.id);

  const handleBulkApprove = async () => {
    if (pendingAccounts.length === 0) return;
    
    if (!window.confirm("Yakin ingin menyetujui semua akun menunggu yang sedang tampil?")) {
      return;
    }

    setActionError("");
    setIsBulkUpdating(true);

    for (const acc of pendingAccounts) {
      const { error } = await supabase.from("profiles").update({ status: "approved" }).eq("user_id", acc.user_id);
      if (error) {
        setActionError(`Error pada akun ${acc.full_name}: ${error.message}`);
        break;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    setIsBulkUpdating(false);
  };

  const normalizeWhatsappNumber = (raw: string | null) => {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length < 9) return null;
    
    if (digits.startsWith("08")) return "628" + digits.slice(2);
    if (digits.startsWith("8")) return "628" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return null;
  };

  const generateAccountMessage = (account: AccountWithChildren) => {
    let statusMsg = "";
    if (account.status === "pending") statusMsg = "sedang menunggu persetujuan admin";
    else if (account.status === "approved") statusMsg = "sudah disetujui dan boleh login kembali";
    else if (account.status === "rejected") statusMsg = "belum dapat disetujui, hubungi admin/koordinator";
    else if (account.status === "inactive") statusMsg = "dinonaktifkan sementara, hubungi admin/koordinator";

    let msg = `Assalamu’alaikum warahmatullahi wabarakatuh.\n\nBapak/Ibu ${account.full_name}, akun Anda di Sistem Tahsin & Tahfizh SDIT Luqmanul Hakim ${statusMsg}.\n\nBarakallahu fiikum.`;

    if (account.role === "parent") {
      if (account.children && account.children.length > 0) {
        msg += `\n\nData anak terhubung:\n` + account.children.map(c => `- ${c}`).join("\n");
      } else {
        msg += `\n\nData anak belum ditemukan/terhubung. Mohon pastikan kembali data anak kepada admin.`;
      }
    }
    return msg;
  };

  const buildWhatsappUrl = (account: AccountWithChildren) => {
    const no = normalizeWhatsappNumber(account.whatsapp);
    if (!no) return null;
    const msg = generateAccountMessage(account);
    return `https://wa.me/${no}?text=${encodeURIComponent(msg)}`;
  };

  const copyToClipboard = async (account: AccountWithChildren) => {
    try {
      const msg = generateAccountMessage(account);
      await navigator.clipboard.writeText(msg);
      setCopyFeedbackId(account.user_id);
      setTimeout(() => setCopyFeedbackId(null), 2000);
    } catch (err) {
      alert("Gagal menyalin pesan");
    }
  };

  const getStatusDisplay = (status: AccountRow["status"]) => {
    switch (status) {
      case "pending":
        return { label: "Menunggu", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50" };
      case "approved":
        return { label: "Disetujui", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50" };
      case "rejected":
        return { label: "Ditolak", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50" };
      case "inactive":
        return { label: "Nonaktif", color: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700/60" };
    }
  };

  if (!isAdmin) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses admin.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5" style={{ zoom: "75%" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Akun All User</h1>
          <p className="text-sm text-muted-foreground">Kelola akun guru dan orang tua yang mendaftar melalui halaman publik.</p>
        </div>
        <button
          onClick={handleBulkApprove}
          disabled={pendingAccounts.length === 0 || isBulkUpdating || isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBulkUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Setujui Semua Menunggu
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-2">
        <button 
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          className={`rounded-xl border text-left p-3 shadow-sm transition-all ${statusFilter === "pending" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-card hover:border-emerald-300"}`}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menunggu</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === "approved" ? "all" : "approved")}
          className={`rounded-xl border text-left p-3 shadow-sm transition-all ${statusFilter === "approved" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-card hover:border-emerald-300"}`}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disetujui</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")}
          className={`rounded-xl border text-left p-3 shadow-sm transition-all ${statusFilter === "rejected" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-card hover:border-emerald-300"}`}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ditolak</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.rejected}</p>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")}
          className={`rounded-xl border text-left p-3 shadow-sm transition-all ${statusFilter === "inactive" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-card hover:border-emerald-300"}`}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nonaktif</p>
          <p className="mt-1 text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.inactive}</p>
        </button>
        <button 
          onClick={() => setRoleFilter(roleFilter === "teacher" ? "all" : "teacher")}
          className={`rounded-xl border text-left p-3 shadow-sm transition-all ${roleFilter === "teacher" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-card hover:border-emerald-300"}`}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guru</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.teacher}</p>
        </button>
        <button 
          onClick={() => setRoleFilter(roleFilter === "parent" ? "all" : "parent")}
          className={`rounded-xl border text-left p-3 shadow-sm transition-all ${roleFilter === "parent" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-card hover:border-emerald-300"}`}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orang Tua</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.parent}</p>
        </button>
      </div>

      {actionError && (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, username, atau WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="teacher">Guru</option>
            <option value="parent">Orang Tua</option>
            {accounts.some((a) => a.role === "tester") && <option value="tester">Penguji</option>}
          </select>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-secondary px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {recentUpdatedAccount && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 shadow-sm relative">
          <button 
            onClick={() => setRecentUpdatedAccount(null)}
            className="absolute top-2 right-2 p-1 text-emerald-600/60 hover:text-emerald-800 dark:text-emerald-400/60 dark:hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Status akun berhasil diperbarui.</h3>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300/80">
                Akun <strong>{recentUpdatedAccount.full_name}</strong> kini berstatus <strong>{getStatusDisplay(recentUpdatedAccount.status).label}</strong>.
              </p>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(recentUpdatedAccount)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-800/60"
                >
                  {copyFeedbackId === recentUpdatedAccount.user_id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copyFeedbackId === recentUpdatedAccount.user_id ? "Tersalin!" : "Salin Pesan"}
                </button>
                {buildWhatsappUrl(recentUpdatedAccount) ? (
                  <button
                    onClick={() => window.open(buildWhatsappUrl(recentUpdatedAccount)!, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Buka WhatsApp
                  </button>
                ) : (
                  <button disabled className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-600/50 opacity-60 dark:bg-emerald-900/30 dark:text-emerald-400/50">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Buka WhatsApp (Nomor belum valid)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredAccounts.map((account) => {
          const isUpdating = updatingUserId === account.user_id;
          const isCurrentAdmin = account.user_id === user?.id;
          const waUrl = buildWhatsappUrl(account as AccountWithChildren);
          const isEditing = editingUserId === account.user_id;

          return (
            <article key={account.user_id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mb-2 p-3 bg-secondary/30 rounded-xl border border-border">
                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-muted-foreground">Nama Lengkap</label>
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-muted-foreground">Username</label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleEditSave(account.user_id)}
                          disabled={isSavingEdit}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          disabled={isSavingEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-foreground">{account.full_name}</h2>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${getStatusDisplay(account.status).color}`}>
                        {getStatusDisplay(account.status).label}
                      </span>
                      <span className="rounded-full bg-secondary/80 border border-border px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-foreground">
                        {getRoleLabel(account.role)}
                      </span>
                      {isCurrentAdmin && (
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-muted-foreground border border-border">
                          Akun Anda
                        </span>
                      )}
                    </div>
                  )}

                  {!isEditing && (
                    <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">@{account.username || "-"}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{account.whatsapp || "WhatsApp belum diisi"}</span>
                    </p>
                  )}
                  
                  <p className="mt-1 text-xs text-muted-foreground">
                    Terdaftar: {new Date(account.registered_at).toLocaleString("id-ID")}
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
                    disabled={isUpdating || isBulkUpdating || isCurrentAdmin}
                    onClick={() => updateStatus(account.user_id, "approved")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Setujui
                  </button>
                  <button
                    disabled={isUpdating || isBulkUpdating || isCurrentAdmin}
                    onClick={() => updateStatus(account.user_id, "rejected")}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" /> Tolak
                  </button>
                  <button
                    disabled={isUpdating || isBulkUpdating || isCurrentAdmin}
                    onClick={() => updateStatus(account.user_id, "inactive")}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" /> Nonaktifkan
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <button
                  onClick={() => {
                    setEditingUserId(account.user_id);
                    setEditForm({ full_name: account.full_name, username: account.username || "" });
                  }}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Edit Akun
                </button>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button
                  onClick={() => copyToClipboard(account as AccountWithChildren)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  {copyFeedbackId === account.user_id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  {copyFeedbackId === account.user_id ? "Tersalin!" : "Salin Pesan"}
                </button>
                {waUrl ? (
                  <button
                    onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Buka WhatsApp
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground/70 italic px-2">
                    *Nomor WhatsApp belum valid
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {filteredAccounts.length === 0 && accounts.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <SearchX className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Tidak ada hasil</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tidak ada akun yang sesuai dengan filter pencarian Anda.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" /> Reset Filter
            </button>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Belum ada akun yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
}
