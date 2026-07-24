import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "follow"
  | "challenge_invite"
  | "challenge_result"
  | "achievement"
  | "like"
  | "comment"
  | "poll_vote"
  | "announcement"
  | "message"
  | "payment_approved"
  | "payment_rejected";

export const NOTIFICATION_META: Record<NotificationType, { icon: string; color: string; section: string }> = {
  friend_request:   { icon: "👋", color: "text-blue-500",    section: "Do'stlar" },
  friend_accepted:  { icon: "🤝", color: "text-emerald-500", section: "Do'stlar" },
  follow:           { icon: "➕", color: "text-primary",     section: "Profil" },
  challenge_invite: { icon: "⚔️", color: "text-amber-500",   section: "Do'stlar • Musobaqa" },
  challenge_result: { icon: "🏆", color: "text-amber-500",   section: "Do'stlar • Musobaqa" },
  achievement:      { icon: "🎖️", color: "text-purple-500",  section: "Yutuqlar" },
  like:             { icon: "❤️", color: "text-red-500",     section: "Lenta" },
  comment:          { icon: "💬", color: "text-blue-500",    section: "Lenta" },
  poll_vote:        { icon: "📊", color: "text-blue-500",    section: "Lenta" },
  announcement:     { icon: "🚀", color: "text-primary",     section: "E'lon" },
  message:          { icon: "✉️", color: "text-emerald-500", section: "Hamjamiyat • Shaxsiy xabar" },
  payment_approved: { icon: "✅", color: "text-green-500",   section: "To'lov • Pro obuna" },
  payment_rejected: { icon: "❌", color: "text-destructive", section: "To'lov" },
};

/** Creates a notification for another user. Never throws — notifications are best-effort. */
export const createNotification = async (params: {
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  relatedId?: string;
}) => {
  try {
    await supabase.from("notifications").insert({
      user_id: params.userId,
      actor_id: params.actorId,
      type: params.type,
      title: params.title,
      body: params.body,
      related_id: params.relatedId,
    });
  } catch (err) {
    console.error("createNotification error:", err);
  }
};
