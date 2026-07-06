import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useActivityLogs, ACTIVITY_META, type ActivityLog } from "@/hooks/useActivityLog";

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const ActivityItem = ({ log, index }: { log: ActivityLog; index: number }) => {
  const meta = ACTIVITY_META[log.activity_type] || {
    icon: "📌", 
    color: "text-slate-700", 
    bgColor: "bg-slate-50", 
    borderColor: "border-slate-200"
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-3 group"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border ${meta.bgColor} ${meta.borderColor}`}>
          {meta.icon}
        </div>
        <div className="w-px flex-1 bg-border mt-1 group-last:hidden" />
      </div>

      {/* Content */}
      <div className={`mb-4 flex-1 rounded-xl border p-3 ${meta.bgColor} ${meta.borderColor}`}>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${meta.color}`}>{log.judul}</p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
            {formatRelative(log.created_at)}
          </span>
        </div>
        {log.deskripsi && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{log.deskripsi}</p>
        )}
        {/* Metadata badges */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(log.metadata).map(([k, v]) => (
              <span key={k} className="text-[10px] bg-background/70 border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                {k}: <span className="font-medium text-foreground">{String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface Props { studentId: string; }

const ActivityLogPanel = ({ studentId }: Props) => {
  const { data: logs = [], isLoading } = useActivityLogs(studentId);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full p-5 border-b border-border flex items-center gap-2 hover:bg-muted/30 transition-colors text-left"
      >
        <Activity className="w-5 h-5 text-primary flex-shrink-0" />
        <h2 className="font-bold text-foreground flex-1">Log Aktivitas</h2>
        <span className="text-xs text-muted-foreground mr-2">{logs.length} aktivitas</span>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-5">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Memuat…</p>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aktivitas akan muncul saat guru mencatat progres, ujian, atau pindah rombel.
                  </p>
                </div>
              ) : (
                <div>
                  {logs.map((log, i) => (
                    <ActivityItem key={log.id} log={log} index={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityLogPanel;
