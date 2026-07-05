import { useCallback, useEffect, useRef, useState } from "react";

type Lang = "uz-UZ" | "en-US";

// Browser Web Speech API shim
function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export interface UseVoiceRecognition {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: (lang?: Lang) => void;
  stop: () => void;
  reset: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognition {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fallbackTriedRef = useRef(false);
  const currentLangRef = useRef<Lang>("uz-UZ");

  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = !!SpeechRecognitionClass;

  const cleanup = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch {
        /* noop */
      }
    }
    recognitionRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startInternal = useCallback(
    (lang: Lang) => {
      if (!SpeechRecognitionClass) {
        setError("Sizning brauzeringiz ovoz tanishni qo'llab-quvvatlamaydi");
        return;
      }
      cleanup();
      const rec = new SpeechRecognitionClass();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      currentLangRef.current = lang;
      recognitionRef.current = rec;

      setTranscript("");
      setInterim("");
      setError(null);

      let finalText = "";

      rec.onresult = (event: any) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalText += res[0].transcript;
          else interimText += res[0].transcript;
        }
        setInterim(interimText);
        if (finalText) setTranscript(finalText.trim());
      };

      rec.onerror = (event: any) => {
        const err = event.error as string;
        // Try en-US fallback once on no-speech or language errors
        if (
          !fallbackTriedRef.current &&
          lang === "uz-UZ" &&
          (err === "no-speech" || err === "language-not-supported" || err === "aborted")
        ) {
          fallbackTriedRef.current = true;
          setTimeout(() => startInternal("en-US"), 50);
          return;
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          setError("Mikrofonga ruxsat berilmagan. Brauzer sozlamalaridan ruxsat bering.");
        } else if (err === "no-speech") {
          setError("Ovoz eshitilmadi. Qaytadan urinib ko'ring.");
        } else if (err === "audio-capture") {
          setError("Mikrofon topilmadi.");
        } else {
          setError("Ovoz tanishda xatolik yuz berdi.");
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      try {
        rec.start();
        setIsListening(true);
      } catch (e) {
        setError("Ovoz tanishni boshlab bo'lmadi.");
        setIsListening(false);
      }
    },
    [SpeechRecognitionClass, cleanup],
  );

  const start = useCallback(
    (lang: Lang = "uz-UZ") => {
      fallbackTriedRef.current = false;
      startInternal(lang);
    },
    [startInternal],
  );

  const stop = useCallback(() => {
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { isSupported, isListening, transcript, interim, error, start, stop, reset };
}