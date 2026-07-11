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
  | "announcement";

export const NOTIFICATION_META: Record<NotificationType, { icon: string; color: string }> = {
  friend_request: { icon: "👋", color: "text-blue-500" },
  friend_accepted: { icon: "🤝", color: "text-emerald-500" },
  follow: { icon: "➕", color: "text-primary" },
  challenge_invite: { icon: "⚔️", color: "text-amber-500" },
  challenge_result: { icon: "🏆", color: "text-amber-500" },
  achievement: { icon: "🎖️", color: "text-purple-500" },
  like: { icon: "❤️", color: "text-red-500" },
  comment: { icon: "💬", color: "text-blue-500" },
  poll_vote: { icon: "📊", color: "text-blue-500" },
  announcement: { icon: "🚀", color: "text-primary" },
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
