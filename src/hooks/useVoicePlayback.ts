import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
          body: { text: key, mode: "voice_assistant" },
        });
        if (error) throw error;
        const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
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