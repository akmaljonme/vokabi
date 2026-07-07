import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useGamification } from "@/hooks/useGamification";

export const NotificationBell = () => {
  const { supported, permission, requestPermission, scheduleStreakReminder } = usePushNotifications();
  const { progress } = useGamification();
  const [showTooltip, setShowTooltip] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

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
    // Re-check periodically in case the tab stays open into the evening
    const interval = setInterval(check, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [permission, progress?.last_activity_date, progress?.current_streak]);

  if (!supported) return null;

  const handleClick = async () => {
    if (permission === "granted") {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    const granted = await requestPermission();
    if (granted) {
      setJustEnabled(true);
      setTimeout(() => setJustEnabled(false), 3000);
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`p-2 rounded-xl transition-colors ${
          permission === "granted"
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:bg-muted/50"
        }`}
        title={permission === "granted" ? "Bildirishnomalar yoqilgan" : "Bildirishnomalarni yoqish"}
      >
        {permission === "granted" ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </motion.button>

      <AnimatePresence>
        {justEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-xl p-3 shadow-xl z-50 text-xs"
          >
            <div className="flex items-center gap-2 text-green-500 font-medium mb-1">
              <Check className="w-3.5 h-3.5" /> Yoqildi!
            </div>
            <p className="text-muted-foreground">Streak eslatmalari va yangi vazifalar haqida xabar olasiz</p>
          </motion.div>
        )}
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-full mt-2 w-44 bg-popover border border-border rounded-xl p-3 shadow-xl z-50 text-xs text-muted-foreground"
          >
            <Bell className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
            Bildirishnomalar yoqilgan
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
