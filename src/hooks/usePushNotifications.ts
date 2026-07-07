import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== "granted") return;
    try {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-32x32.png",
        ...options,
      });
    } catch {}
  };

  // Streak eslatma — faqat kechqurun va faqat foydalanuvchi bugun hali faol bo'lmagan bo'lsa
  const scheduleStreakReminder = (params?: {
    hasActivityToday?: boolean;
    currentStreak?: number;
  }) => {
    if (permission !== "granted") return;
    const today = new Date().toDateString();
    const alreadySentToday = localStorage.getItem("vokabi_streak_reminder_sent") === today;
    if (alreadySentToday) return;

    const hasActivityToday = params?.hasActivityToday ?? false;
    const currentStreak = params?.currentStreak ?? 0;
    const hour = new Date().getHours();

    // Faqat kechqurun (18:00dan keyin) va bugun hali hech qanday faoliyat bo'lmasa eslatamiz
    if (hour >= 18 && !hasActivityToday) {
      sendNotification(
        currentStreak > 0 ? "🔥 Streakingiz xavf ostida!" : "👋 Bugun mashq qilmadingiz",
        {
          body:
            currentStreak > 0
              ? `${currentStreak} kunlik streakingizni yo'qotmang — hoziroq bir mashq qiling!`
              : "Bugun ham ozgina mashq qilib, o'rganishni davom ettiring.",
          tag: "streak-reminder",
        },
      );
      localStorage.setItem("vokabi_streak_reminder_sent", today);
    }
  };

  const notifyNewAssignment = (title: string) => {
    sendNotification("📝 Yangi vazifa!", {
      body: `O'qituvchingiz yangi vazifa berdi: ${title}`,
      tag: "new-assignment",
    });
  };

  const notifyLevelUp = (level: string) => {
    sendNotification("🎉 Tabriklaymiz!", {
      body: `Siz yangi darajaga yetdingiz: ${level}`,
      tag: "level-up",
    });
  };

  return {
    supported,
    permission,
    requestPermission,
    sendNotification,
    scheduleStreakReminder,
    notifyNewAssignment,
    notifyLevelUp,
  };
};
