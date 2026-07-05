import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

const cache = new Map<string, string>();

export function useVoicePlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
        a.src = "";
      } catch {
        /* noop */
      }
    }
    audioRef.current = null;
  }, []);

  const speak = useCallback(
    async (text: string) => {
      const key = text.trim();
      if (!key) return;
      stop();
      let url = cache.get(key);
      if (!url) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: key, mode: "voice_assistant" }),
        });
        if (!res.ok) {
          const err = await res.text().catch(() => "");
          throw new Error(err || `TTS ${res.status}`);
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        // Limit cache
        if (cache.size > 30) {
          const first = cache.keys().next().value;
          if (first) {
            URL.revokeObjectURL(cache.get(first)!);
            cache.delete(first);
          }
        }
        cache.set(key, url);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play().catch(() => {
        /* autoplay may be blocked; ignore */
      });
    },
    [stop],
  );

  return { speak, stop };
}