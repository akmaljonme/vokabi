import { useState, useCallback, useRef } from 'react';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
}

interface UseElevenLabsTTSReturn {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  currentAudioUrl: string | null;
  generateAudio: (text: string) => Promise<string | null>;
  playAudio: (text: string) => Promise<void>;
  stopAudio: () => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
}

// Voice IDs for different speaker types
export const VOICE_IDS = {
  british_male: 'JBFqnCBsd6RMkjVDRZzb', // George - British male
  british_female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - British female
  american_male: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - American male
  american_female: 'Xb7hH8MSUJpSbSDYk0k2', // Alice - American female
  narrator: 'onwK4e9ZLuTAKqWW03F9', // Daniel - Narrator
};

export const useElevenLabsTTS = (options: UseElevenLabsTTSOptions = {}): UseElevenLabsTTSReturn => {
  const { voiceId = VOICE_IDS.british_male } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  const generateAudio = useCallback(async (text: string): Promise<string | null> => {
    // Check cache first
    const cacheKey = `${voiceId}-${text}`;
    if (audioCache.current.has(cacheKey)) {
      return audioCache.current.get(cacheKey)!;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio URL
      audioCache.current.set(cacheKey, audioUrl);
      setCurrentAudioUrl(audioUrl);
      
      return audioUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate audio';
      setError(errorMessage);
      console.error('TTS error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [voiceId]);

  const playAudio = useCallback(async (text: string) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioUrl = await generateAudio(text);
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setError('Failed to play audio');
      setIsPlaying(false);
      audioRef.current = null;
    };

    try {
      await audio.play();
    } catch (err) {
      setError('Failed to play audio');
      console.error('Audio playback error:', err);
    }
  }, [generateAudio]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
    }
  }, []);

  return {
    isLoading,
    isPlaying,
    error,
    currentAudioUrl,
    generateAudio,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
  };
};
