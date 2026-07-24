import { useEffect, useState } from "react";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { ScrollText, Loader2, Shield, ShieldOff, Crown, UserX, Rocket, CheckCircle2, XCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";

interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
  target_name?: string | null;
}

const ACTION_META: Record<string, { label: string; icon: any; color: string }> = {
  role_granted:    { label: "Admin huquqi berildi",      icon: Shield,      color: "text-blue-500 bg-blue-500/10" },
  role_removed:    { label: "Admin huquqi olib tashlandi", icon: ShieldOff, color: "text-slate-500 bg-slate-500/10" },
  pro_granted:     { label: "Pro status berildi",        icon: Crown,       color: "text-amber-500 bg-amber-500/10" },
  pro_removed:     { label: "Pro status olib tashlandi", icon: Crown,       color: "text-slate-500 bg-slate-500/10" },
  user_deleted:    { label: "Foydalanuvchi o'chirildi",  icon: UserX,       color: "text-destructive bg-destructive/10" },
  broadcast_sent:  { label: "Ommaviy xabar yuborildi",   icon: Rocket,      color: "text-purple-500 bg-purple-500/10" },
  payment_approved:{ label: "To'lov tasdiqlandi",        icon: CheckCircle2,color: "text-green-500 bg-green-500/10" },
  payment_rejected:{ label: "To'lov rad etildi",         icon: XCircle,     color: "text-destructive bg-destructive/10" },
  csv_exported:    { label: "CSV eksport qilindi",       icon: Download,    color: "text-cyan-500 bg-cyan-500/10" },
};

export const ActivityLogTab = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const userIds = [...new Set(
        (data || []).flatMap((l: any) => [l.admin_id, l.target_user_id]).filter(Boolean)
      )];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      setLogs((data || []).map((l: any) => ({
        ...l,
        admin_name: nameMap.get(l.admin_id) || "Noma'lum admin",
        target_name: l.target_user_id ? (nameMap.get(l.target_user_id) || "Noma'lum") : null,
      })));
    } catch (err) {
      console.error("Audit log yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === "all" ? logs : logs.filter(l => l.action === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" /> Faoliyat jurnali
          </h2>
          <p className="text-muted-foreground text-sm">
            Barcha adminlar tomonidan bajarilgan muhim harakatlar tarixi (oxirgi 200 ta)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportToCSV("vokabi_activity_log", filteredLogs.map(l => ({
            "Vaqt": new Date(l.created_at).toLocaleString("uz-UZ"),
            "Admin": l.admin_name,
            "Harakat": ACTION_META[l.action]?.label || l.action,
            "Kimga": l.target_name || "—",
            "Tafsilotlar": l.details ? JSON.stringify(l.details) : "",
          })))}
        >
          <Download className="w-4 h-4 mr-2" /> CSV eksport
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          Barchasi ({logs.length})
        </button>
        {Object.entries(ACTION_META).map(([key, meta]) => {
          const count = logs.filter(l => l.action === key).length;
          if (!count) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filteredLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Hozircha yozuvlar yo'q</p>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const meta = ACTION_META[log.action] || { label: log.action, icon: ScrollText, color: "text-muted-foreground bg-muted" };
              const Icon = meta.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.admin_name}</span>
                      {" "}<span className="text-muted-foreground">{meta.label.toLowerCase()}</span>
                      {log.target_name && <> — <span className="font-medium">{log.target_name}</span></>}
                    </p>
                    {!!log.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(log.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
