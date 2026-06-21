import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  { emoji: "📝", text: "IELTS Writing maslahat ber", label: "Writing" },
  { emoji: "🗣️", text: "Speaking qanday yaxshilanadi?", label: "Speaking" },
  { emoji: "📚", text: "Grammar tushuntir", label: "Grammar" },
  { emoji: "🎧", text: "Listening qanday yaxshilanadi?", label: "Listening" },
  { emoji: "🔤", text: "Vocabulary kengaytirish", label: "Vocabulary" },
  { emoji: "🎯", text: "IELTS band 7 uchun nima kerak?", label: "IELTS 7+" },
];

export const AITutorChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  if (location.pathname === "/games" || location.pathname === "/admin" || location.pathname.startsWith("/shared-test")) return null;

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    if (!user) { navigate("/login"); return; }

    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: { messages: updatedMessages },
      });
      if (error) throw error;
      const assistantText = data?.text || "Javob olishda xatolik yuz berdi.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Xatolik yuz berdi. Qayta urinib ko'ring. 😅" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@500;600&display=swap');
        
        .tutor-chat { font-family: 'Nunito', sans-serif; }
        .tutor-bubble-font { font-family: 'Caveat', cursive; }
        
        .tutor-msg-ai {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1.5px solid #86efac;
          color: #14532d;
        }
        .dark .tutor-msg-ai {
          background: linear-gradient(135deg, #052e16 0%, #14532d 100%);
          border-color: #166534;
          color: #bbf7d0;
        }
        .tutor-msg-user {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%);
          color: hsl(var(--primary-foreground));
        }

        .tutor-float-btn {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
          box-shadow: 0 8px 32px hsl(var(--primary) / 0.4), 0 0 0 0 hsl(var(--primary) / 0.3);
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 8px 32px hsl(var(--primary) / 0.4), 0 0 0 0 hsl(var(--primary) / 0.3); }
          50% { box-shadow: 0 8px 32px hsl(var(--primary) / 0.5), 0 0 0 10px hsl(var(--primary) / 0); }
        }

        .tutor-quick-btn {
          background: hsl(var(--muted));
          border: 1.5px solid hsl(var(--border));
          transition: all 0.2s;
        }
        .tutor-quick-btn:hover {
          background: hsl(var(--primary) / 0.1);
          border-color: hsl(var(--primary) / 0.4);
          transform: translateY(-1px);
        }

        .tutor-input {
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
        }
        .tutor-input:focus { outline: none; }

        .tutor-header {
          background: linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.05));
          border-bottom: 1.5px solid hsl(var(--primary) / 0.2);
        }

        .tutor-send-btn {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85));
          transition: all 0.2s;
        }
        .tutor-send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .tutor-send-btn:disabled { opacity: 0.4; }

        .tutor-typing span {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: hsl(var(--primary));
          animation: bounce-dot 1.2s ease-in-out infinite;
        }
        .tutor-typing span:nth-child(2) { animation-delay: 0.15s; }
        .tutor-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        .tutor-scrollbar::-webkit-scrollbar { width: 4px; }
        .tutor-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .tutor-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 99px; }
      `}</style>

      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            whileHover={{ scale: 1.12, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="tutor-chat fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl text-white flex items-center justify-center tutor-float-btn"
          >
            <span className="text-2xl">🤖</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="tutor-chat fixed bottom-6 right-6 z-50 w-[390px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-5rem)] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ boxShadow: "0 24px 80px hsl(var(--primary) / 0.2), 0 8px 32px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="tutor-header flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-xl">🤖</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">AI Tutor</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold">Ingliz tili yordamchisi ✨</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={clearChat}
                    className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 tutor-scrollbar">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-4"
                >
                  {/* Welcome */}
                  <div className="text-center mb-5">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="text-5xl mb-3"
                    >🎓</motion.div>
                    <p className="font-black text-base mb-1">Salom! Men AI Tutor 👋</p>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed max-w-[260px] mx-auto">
                      Ingliz tili bo'yicha har qanday savolingizni bering. Yordam berishga tayyorman!
                    </p>
                  </div>

                  {/* Quick prompts */}
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map(({ emoji, text, label }, i) => (
                      <motion.button
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        onClick={() => sendMessage(text)}
                        className="tutor-quick-btn rounded-2xl px-3 py-2.5 text-left flex items-center gap-2"
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="text-xs font-bold leading-tight">{label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Tip */}
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      💡 Maslahat: IELTS, CEFR, grammatika, lug'at haqida so'rashingiz mumkin!
                    </p>
                  </div>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-base">🤖</div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-semibold leading-relaxed ${
                    msg.role === "user"
                      ? "tutor-msg-user rounded-br-md"
                      : "tutor-msg-ai rounded-bl-md"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-2xl bg-muted flex items-center justify-center shrink-0 mt-0.5 text-base">🙋</div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-base">🤖</div>
                  <div className="tutor-msg-ai rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <div className="tutor-typing flex gap-1">
                      <span /><span /><span />
                    </div>
                    <span className="text-xs font-bold ml-1 opacity-60">Yozmoqda...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested replies after assistant message */}
            {messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isLoading && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {["Ko'proq tushuntir 🔍", "Misol ber 💡", "Rahmat! ✅"].map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors border border-primary/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex gap-2 items-center bg-muted/50 rounded-2xl px-4 py-2 border border-border focus-within:border-primary/40 focus-within:bg-background transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Savolingizni yozing... 💬"
                  className="tutor-input flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="tutor-send-btn w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-2 font-semibold">
                Powered by Vokabi AI ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
