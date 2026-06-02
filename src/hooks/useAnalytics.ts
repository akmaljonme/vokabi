// Lightweight analytics — localStorage + Supabase
import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

type EventName =
  | "page_view"
  | "test_started"
  | "test_completed"
  | "game_played"
  | "video_watched"
  | "essay_checked"
  | "word_added"
  | "login"
  | "register"
  | "upgrade_clicked";

interface EventData {
  [key: string]: string | number | boolean | null;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const track = useCallback(async (event: EventName, data?: EventData) => {
    try {
      // localStorage ga saqlash (offline ham ishlaydi)
      const key = `vokabi_analytics_${event}`;
      const count = parseInt(localStorage.getItem(key) || "0") + 1;
      localStorage.setItem(key, String(count));

      // Supabase ga yuborish (agar jadval bo'lsa)
      if (user) {
        await (supabase.from("analytics_events") as any).insert({
          user_id: user.id,
          event_name: event,
          event_data: data || {},
          created_at: new Date().toISOString(),
        }).then(() => {}); // xato bo'lsa ham davom et
      }
    } catch {
      // analytics xatosi asosiy funksiyani to'xtatmasin
    }
  }, [user]);

  const trackPageView = useCallback((page: string) => {
    track("page_view", { page });
  }, [track]);

  return { track, trackPageView };
};
