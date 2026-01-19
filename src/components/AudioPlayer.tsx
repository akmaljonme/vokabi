import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Loader2, RefreshCw } from 'lucide-react';
import { useElevenLabsTTS, VOICE_IDS } from '@/hooks/useElevenLabsTTS';

interface AudioPlayerProps {
  text: string;
  label?: string;
  voiceId?: string;
  autoPlay?: boolean;
  showTranscript?: boolean;
}

export default function AudioPlayer({ 
  text, 
  label = 'Listen', 
  voiceId = VOICE_IDS.british_male,
  autoPlay = false,
  showTranscript = false,
}: AudioPlayerProps) {
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { isLoading, isPlaying, error, generateAudio, playAudio, stopAudio } = useElevenLabsTTS({ voiceId });

  useEffect(() => {
    // Pre-generate audio on mount
    generateAudio(text).then(url => {
      if (url) {
        setAudioUrl(url);
        if (autoPlay) {
          playAudio(text);
        }
      }
    });
  }, [text, generateAudio, autoPlay]);

  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.ontimeupdate = () => {
        setProgress((audio.currentTime / audio.duration) * 100);
      };

      audio.onended = () => {
        setProgress(0);
      };

      audio.volume = volume / 100;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlay = async () => {
    if (isPlaying) {
      stopAudio();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        await audioRef.current.play();
      } else {
        await playAudio(text);
      }
    }
  };

  const handleReplay = async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } else {
      await playAudio(text);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
        <p>Audio generation failed: {error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => generateAudio(text)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {showTranscript && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowText(!showText)}
          >
            {showText ? 'Hide' : 'Show'} Transcript
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlay}
          disabled={isLoading}
          className="h-12 w-12 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleReplay}
          disabled={isLoading || !audioUrl}
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="flex-1 space-y-1">
          <Slider
            value={[progress]}
            max={100}
            step={1}
            className="cursor-pointer"
            onValueChange={([value]) => {
              if (audioRef.current) {
                audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime((progress / 100) * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            className="w-20"
            onValueChange={([value]) => {
              setVolume(value);
              setIsMuted(false);
            }}
          />
        </div>
      </div>

      {showText && showTranscript && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}
