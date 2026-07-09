import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { permission, scheduleStreakReminder } = usePushNotifications();
  const { progress } = useGamification();
  const [unreadCount, setUnreadCount] = useState(0);

  // Real unread-notification count, refreshed on mount and periodically
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Streak push-reminder — still runs quietly in the background (evening-only, deduped)
  useEffect(() => {
    if (permission !== "granted") return;
    const today = new Date().toISOString().split("T")[0];
    const check = () => {
      scheduleStreakReminder({
        hasActivityToday: progress?.last_activity_date === today,
        currentStreak: progress?.current_streak || 0,
      });
    };
    check();
    const interval = setInterval(check, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [permission, progress?.last_activity_date, progress?.current_streak]);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate("/notifications")}
      className="relative p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
      title="Bildirishnomalar"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </motion.button>
  );
};
