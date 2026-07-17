import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

/**
 * Mounted once at the app root. Listens for new direct_messages addressed to
 * the current user and fires a real browser push notification (if enabled)
 * plus an in-app toast, no matter which page the user is currently on.
 */
export const useDMPushNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { permission, sendNotification } = usePushNotifications();
  const senderCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-dm-push")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${user.id}` },
        async (payload: any) => {
          const msg = payload.new;
          if (!msg || msg.sender_id === user.id) return;

          // Yuboruvchi ismini olib kelamiz (keshlab, keraksiz so'rovlarni kamaytiramiz)
          let senderName = senderCache.current[msg.sender_id];
          if (!senderName) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", msg.sender_id)
              .maybeSingle();
            senderName = profile?.full_name || "Foydalanuvchi";
            senderCache.current[msg.sender_id] = senderName;
          }

          const preview = msg.image_url ? "📷 Rasm yubordi" : msg.audio_url ? "🎤 Ovozli xabar yubordi" : msg.content;

          // Real brauzer push-bildirishnomasi (ruxsat berilgan bo'lsa)
          if (permission === "granted") {
            sendNotification(`💬 ${senderName}`, {
              body: preview?.slice(0, 100),
              tag: `dm-${msg.sender_id}`,
            });
          }

          // Darhol ko'rinadigan in-app toast — bosilsa suhbatga olib boradi
          toast(`💬 ${senderName}`, {
            description: preview?.slice(0, 100),
            action: {
              label: "Ochish",
              onClick: () => navigate(`/community?dm=${msg.sender_id}`),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, sendNotification, navigate]);
};
