import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NOTIFICATION_META, NotificationType } from "@/lib/notifications";

interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  actor_name?: string;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hozir";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { supported, permission, requestPermission } = usePushNotifications();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (data || []) as NotificationRow[];
    const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)));
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", actorIds);
      rows.forEach((r) => {
        r.actor_name = profiles?.find((p: any) => p.user_id === r.actor_id)?.full_name;
      });
    }
    setItems(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    if (!user) return;
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-display font-black flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Bildirishnomalar
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} ta o'qilmagan</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 mr-1.5" /> Barchasini o'qilgan qilish
            </Button>
          )}
        </div>

        {supported && permission === "default" && (
          <div className="mb-5 p-4 rounded-2xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm">
              🔔 Push-bildirishnomalarni yoqing — muhim yangiliklarni birinchilardan bo'lib bilib turing.
            </p>
            <Button size="sm" onClick={requestPermission}>Yoqish</Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Hozircha bildirishnoma yo'q</p>
            <p className="text-sm mt-1">Yangiliklar shu yerda paydo bo'ladi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n, i) => {
              const meta = NOTIFICATION_META[n.type] || { icon: "🔔", color: "text-primary" };
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                    n.is_read ? "border-border/50" : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-lg shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </motion.button>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
