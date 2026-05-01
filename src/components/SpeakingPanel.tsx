import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { Mic, MicOff, ArrowLeft, ArrowRight, Send, CheckCircle, RotateCcw, Trash2, Sparkles, Lightbulb, Volume2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Question } from '@/types/cefr';

interface SpeakingPanelProps {
  questions: Question[];
  currentIdx: number;
  setCurrentIdx: (n: number | ((p: number) => number)) => void;
  isRecording: boolean;
  setIsRecording: (b: boolean) => void;
  recordings: Record<number, { blob: Blob; url: string }>;
  setRecordings: React.Dispatch<React.SetStateAction<Record<number, { blob: Blob; url: string }>>>;
  transcripts: Record<number, string>;
  setTranscripts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  mediaRecorderRef: MutableRefObject<MediaRecorder | null>;
  chunksRef: MutableRefObject<Blob[]>;
  recognitionRef: MutableRefObject<any>;
  onFinish: () => void;
}

const PREP_SECONDS = 15;
const MAX_RECORD_SECONDS = 120;

export const SpeakingPanel = ({
  questions, currentIdx, setCurrentIdx,
  isRecording, setIsRecording,
  recordings, setRecordings,
  transcripts, setTranscripts,
  mediaRecorderRef, chunksRef, recognitionRef,
  onFinish,
}: SpeakingPanelProps) => {
  const currentQ = questions[currentIdx];
  const recording = recordings[currentIdx];
  const transcript = transcripts[currentIdx] || '';
  const interimTranscriptRef = useRef('');
  const [interimText, setInterimText] = useState('');

  // Recording duration timer
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preparation countdown
  const [prepLeft, setPrepLeft] = useState(0);
  const [prepActive, setPrepActive] = useState(false);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio level visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  // Reset interim when switching questions
  useEffect(() => {
    setInterimText('');
    interimTranscriptRef.current = '';
  }, [currentIdx]);

  const startPreparation = () => {
    if (prepActive || isRecording) return;
    setPrepLeft(PREP_SECONDS);
    setPrepActive(true);
    prepTimerRef.current = setInterval(() => {
      setPrepLeft((p) => {
        if (p <= 1) {
          if (prepTimerRef.current) clearInterval(prepTimerRef.current);
          setPrepActive(false);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const skipPreparation = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setPrepActive(false);
    setPrepLeft(0);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => ({ ...prev, [currentIdx]: { blob, url } }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      // Audio level analyser
      try {
        const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AC();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setAudioLevel(sum / data.length / 255);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {}

      // Recording timer with auto-stop
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) {
            stopRecording();
            return MAX_RECORD_SECONDS;
          }
          return s + 1;
        });
      }, 1000);

      // Speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        let finalTranscript = transcripts[currentIdx] || '';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimText(interim);
          setTranscripts((prev) => ({ ...prev, [currentIdx]: finalTranscript.trim() }));
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      alert("Mikrofonga ruxsat bering va qayta urinib ko'ring.");
    }
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const deleteRecording = () => {
    if (!recording) return;
    URL.revokeObjectURL(recording.url);
    setRecordings((prev) => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
    setTranscripts((prev) => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
    setInterimText('');
    setRecordSeconds(0);
  };

  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const completedCount = Object.keys(recordings).length;
  const formatSec = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Visual bars for waveform
  const bars = Array.from({ length: 24 });

  if (!currentQ) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header / progress */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-rose-500 hover:bg-rose-500">
            <Mic className="w-3 h-3 mr-1" />Speaking
          </Badge>
          <Badge variant="outline">Savol {currentIdx + 1} / {questions.length}</Badge>
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
            {completedCount} yozildi
          </Badge>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => !isRecording && setCurrentIdx(i)}
              disabled={isRecording}
              className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                i === currentIdx
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : recordings[i]
                  ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border-2 border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-card to-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Savolni o'qing va javob bering</span>
        </div>
        <p className="text-xl sm:text-2xl font-semibold leading-snug">{currentQ.question}</p>
      </div>

      {/* Preparation timer */}
      {!recording && !isRecording && (
        <div className="rounded-2xl border bg-card p-4">
          {prepActive ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold tabular-nums">
                  {prepLeft}
                </div>
                <div>
                  <p className="text-sm font-medium">Tayyorgarlik vaqti</p>
                  <p className="text-xs text-muted-foreground">Fikrlaringizni tartiblang</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={skipPreparation}>
                O'tkazib yuborish
              </Button>
            </div>
          ) : (
            <button
              onClick={startPreparation}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>{PREP_SECONDS} soniya tayyorgarlik vaqti olish</span>
            </button>
          )}
        </div>
      )}

      {/* Recording area */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5">
          {/* Waveform visualization */}
          <div className="flex items-center justify-center gap-1 h-16 w-full max-w-md">
            {bars.map((_, i) => {
              const center = bars.length / 2;
              const distFromCenter = Math.abs(i - center) / center;
              const intensity = isRecording ? Math.max(0.15, audioLevel * (1 - distFromCenter * 0.6) * (0.7 + Math.random() * 0.6)) : 0.1;
              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-100 ${isRecording ? 'bg-rose-500' : recording ? 'bg-emerald-500/40' : 'bg-muted'}`}
                  style={{ height: `${Math.max(8, intensity * 64)}px` }}
                />
              );
            })}
          </div>

          {/* Mic button */}
          <button
            onClick={handleMicClick}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-105'
            }`}
          >
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse" />
              </>
            )}
            {isRecording ? <MicOff className="w-12 h-12 relative z-10" /> : <Mic className="w-12 h-12" />}
          </button>

          {/* Status text + timer */}
          <div className="text-center">
            {isRecording ? (
              <>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold tabular-nums text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {formatSec(recordSeconds)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maksimal {formatSec(MAX_RECORD_SECONDS)} • To'xtatish uchun mikrofonni bosing
                </p>
              </>
            ) : recording ? (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 justify-center">
                <CheckCircle className="w-4 h-4" />Yozib olindi ({formatSec(recordSeconds)})
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Yozib olishni boshlash uchun mikrofonni bosing</p>
            )}
          </div>

          {/* Recording playback + actions */}
          {recording && !isRecording && (
            <div className="w-full space-y-3">
              <audio src={recording.url} controls className="w-full" />
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { deleteRecording(); startRecording(); }}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />Qayta yozish
                </Button>
                <Button size="sm" variant="ghost" onClick={deleteRecording} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />O'chirish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live transcript */}
      {(isRecording || transcript) && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Live transkript</span>
              {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            {transcript && (
              <span className="text-xs text-muted-foreground tabular-nums">{wordCount} so'z</span>
            )}
          </div>
          <p className="text-sm leading-relaxed min-h-[2.5rem]">
            {transcript || <span className="text-muted-foreground italic">Gapiring — matn shu yerda paydo bo'ladi...</span>}
            {interimText && <span className="text-muted-foreground italic"> {interimText}</span>}
          </p>
          {!isRecording && transcript && wordCount < 20 && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Javobingiz juda qisqa. To'liqroq javob bering (kamida 30+ so'z).
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          disabled={currentIdx === 0 || isRecording}
          onClick={() => setCurrentIdx((i: number) => i - 1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />Oldingi
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button
            disabled={isRecording}
            onClick={() => setCurrentIdx((i: number) => i + 1)}
          >
            Keyingi <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onFinish}
            disabled={isRecording || completedCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4 mr-1" />AI ga yuborish
          </Button>
        )}
      </div>
    </div>
  );
};