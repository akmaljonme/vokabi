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

  // Streak eslatma — har kuni
  const scheduleStreakReminder = () => {
    if (permission !== "granted") return;
    const lastVisit = localStorage.getItem("vokabi_last_visit");
    const today = new Date().toDateString();
    if (lastVisit !== today) {
      sendNotification("🔥 Streakingizni davom ettiring!", {
        body: "Bugun ham mashq qiling — streak uzilmasin!",
        tag: "streak-reminder",
      });
      localStorage.setItem("vokabi_last_visit", today);
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
