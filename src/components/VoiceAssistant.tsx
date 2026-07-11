import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, X, Send, Sparkles, MessageCircle, GraduationCap, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useVoicePlayback } from "@/hooks/useVoicePlayback";

type Mode = "command" | "speaking";
interface Msg { role: "user" | "assistant"; content: string }

const HIDDEN_PATHS = [/^\/tests\/[^/]+\/take/i, /^\/exams$/i, /^\/mock\//i, /^\/feed$/i, /^\/reels$/i, /^\/u\//i];

export const VoiceAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [permissionModal, setPermissionModal] = useState(false);
  const [mode, setMode] = useState<Mode>("command");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [permissionAsked, setPermissionAsked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isSupported, isListening, transcript, interim, error, start, stop, reset } = useVoiceRecognition();
  const { speak, stop: stopSpeaking } = useVoicePlayback();

  const hidden = !user || HIDDEN_PATHS.some((r) => r.test(location.pathname));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, interim]);

  const handleCommand = useCallback(
    async (utterance: string) => {
      const text = utterance.trim();
      if (!text) return;
      const next: Msg[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      setThinking(true);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("voice-assistant-command", {
          body: { transcript: text, currentPath: location.pathname, conversationHistory: messages },
        });
        if (fnErr) throw fnErr;
        if ((data as any)?.error) throw new Error((data as any).error);
        const reply = (data as any)?.reply || "Kechirasiz, tushunmadim.";
        setMessages([...next, { role: "assistant", content: reply }]);
        speak(reply).catch(() => undefined);

        const intent = (data as any)?.intent;
        const path = (data as any)?.path;
        const action = (data as any)?.action;

        if (intent === "navigate" && typeof path === "string") {
          setTimeout(() => navigate(path), 400);
        } else if (intent === "action") {
          if (action === "start_test") setTimeout(() => navigate("/practice"), 400);
          else if (action === "open_random_game") setTimeout(() => navigate("/games"), 400);
          else if (action === "open_speaking_practice") {
            setMode("speaking");
            setMessages([]);
          }
        }
      } catch (e: any) {
        const msg = e?.message?.includes("limit") ? "Kunlik ovozli limit tugadi. AI Tutor'ga o'ting." : "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
        toast.error(msg);
        setMessages([...next, { role: "assistant", content: msg }]);
      } finally {
        setThinking(false);
        reset();
      }
    },
    [messages, location.pathname, navigate, speak, reset],
  );

  const handleSpeakingTurn = useCallback(
    async (utterance?: string) => {
      const nextHistory: Msg[] = utterance
        ? [...messages, { role: "user", content: utterance }]
        : messages;
      if (utterance) setMessages(nextHistory);
      setThinking(true);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("voice-speaking-practice", {
          body: { history: nextHistory, part: 1 },
        });
        if (fnErr) throw fnErr;
        if ((data as any)?.error) throw new Error((data as any).error);
        const reply = (data as any)?.reply || "Let's continue. Tell me more.";
        const shouldAssess = (data as any)?.shouldAssess;
        setMessages([...nextHistory, { role: "assistant", content: reply }]);
        speak(reply).catch(() => undefined);
        if (shouldAssess) {
          const closing = "Great job! Batafsil baholash uchun Practice sahifasidan to'liq Speaking testni yeching.";
          setTimeout(() => {
            setMessages((m) => [...m, { role: "assistant", content: closing }]);
            speak(closing).catch(() => undefined);
          }, 800);
        }
      } catch (e: any) {
        toast.error(e?.message || "Xatolik");
      } finally {
        setThinking(false);
        reset();
      }
    },
    [messages, speak, reset],
  );

  // Auto-submit when we get a final transcript
  useEffect(() => {
    if (!transcript) return;
    if (mode === "command") handleCommand(transcript);
    else handleSpeakingTurn(transcript);
  }, [transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionAsked(true);
      setPermissionModal(false);
      start(mode === "speaking" ? "en-US" : "uz-UZ");
    } catch {
      toast.error("Mikrofonga ruxsat kerak");
      setPermissionModal(false);
    }
  };

  const handleMicTap = () => {
    if (isListening) {
      stop();
      return;
    }
    if (!permissionAsked) {
      setPermissionModal(true);
      return;
    }
    start(mode === "speaking" ? "en-US" : "uz-UZ");
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = textInput.trim();
    if (!t) return;
    setTextInput("");
    if (mode === "command") handleCommand(t);
    else handleSpeakingTurn(t);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setMessages([]);
    stopSpeaking();
    stop();
    if (m === "speaking") {
      // Kick off first examiner question
      setTimeout(() => handleSpeakingTurn(), 200);
    }
  };

  const openPanel = () => {
    setOpen(true);
    if (mode === "speaking" && messages.length === 0) {
      setTimeout(() => handleSpeakingTurn(), 300);
    }
  };

  const closePanel = () => {
    setOpen(false);
    stop();
    stopSpeaking();
  };

  if (hidden) return null;

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openPanel}
            className="fixed bottom-24 left-4 lg:bottom-8 lg:left-[calc(var(--sidebar-w,220px)+1.25rem)] z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
            aria-label="Alisa ovozli yordamchisi"
          >
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-40" />
            <Sparkles className="w-6 h-6 relative" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            className="fixed bottom-24 left-4 right-4 lg:bottom-8 lg:left-[calc(var(--sidebar-w,220px)+1.25rem)] lg:right-auto z-50 w-auto lg:w-[380px] max-w-[420px] mx-auto"
          >
            <Card className="bg-card/95 backdrop-blur-xl border-border shadow-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">Alisa</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Vokabi AI yordamchisi</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={closePanel} aria-label="Yopish">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="px-3 pt-2 pb-1 flex gap-1">
                <Button
                  size="sm"
                  variant={mode === "command" ? "default" : "outline"}
                  className="flex-1 h-8 text-xs"
                  onClick={() => switchMode("command")}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Buyruq
                </Button>
                <Button
                  size="sm"
                  variant={mode === "speaking" ? "default" : "outline"}
                  className="flex-1 h-8 text-xs"
                  onClick={() => switchMode("speaking")}
                >
                  <GraduationCap className="w-3.5 h-3.5 mr-1" /> Speaking
                </Button>
              </div>

              <div
                ref={scrollRef}
                className="px-4 py-3 max-h-[300px] min-h-[180px] overflow-y-auto space-y-2"
              >
                {messages.length === 0 && !thinking && (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    {mode === "command"
                      ? "Mikrofonni bosing va \"Dashboardni och\", \"O'yinlarni ko'rsat\" deng."
                      : "IELTS Speaking mashqi. Alisa savol beradi, siz ingliz tilida javob bering."}
                  </div>
                )}
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {interim && isListening && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-primary/30 text-foreground italic">
                      {interim}…
                    </div>
                  </div>
                )}
                {thinking && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> o'ylayapti…
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="px-4 py-2 text-xs text-destructive flex items-center gap-1.5 border-t border-border/60">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Input row */}
              <div className="p-3 border-t border-border/60 space-y-2">
                {isSupported ? (
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      onClick={handleMicTap}
                      whileTap={{ scale: 0.9 }}
                      animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                      transition={isListening ? { repeat: Infinity, duration: 1.2 } : { duration: 0.2 }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center relative ${
                        isListening
                          ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40"
                          : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      }`}
                      aria-label={isListening ? "Tinglashni to'xtat" : "Gapirish"}
                    >
                      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      {isListening && (
                        <span className="absolute inset-0 rounded-full border-2 border-destructive animate-ping" />
                      )}
                    </motion.button>
                    <p className="text-[10px] text-muted-foreground">
                      {isListening ? "Tinglayapman…" : "Bosib gapiring"}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Yozing (mikrofon qo'llab-quvvatlanmaydi)"
                      className="h-9 text-sm"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9" disabled={!textInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission explainer */}
      <AnimatePresence>
        {permissionModal && (
          <motion.div
            key="perm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPermissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-center mb-1">Mikrofon ruxsati</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Alisa sizni tinglashi uchun brauzer mikrofoniga ruxsat berishingiz kerak. Ovoz brauzerdan chiqmaydi — server hech qanday audio saqlamaydi.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPermissionModal(false)}>
                  Bekor
                </Button>
                <Button className="flex-1" onClick={requestMicPermission}>
                  Ruxsat berish
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAssistant;