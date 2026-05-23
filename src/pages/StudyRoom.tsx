import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Users, Clock, BookOpen, Send, Flame, Trophy, Volume2, VolumeX } from "lucide-react";

interface RoomUser { id: string; name: string; avatar?: string; focus: number; joined: string; }
interface Message { id: string; user: string; text: string; time: string; }

const ROOMS = [
  { id: "ielts", name: "IELTS Tayyorlanish", emoji: "📝", color: "hsl(217 91% 60%)", desc: "Writing & Reading mashq" },
  { id: "speaking", name: "Speaking Club", emoji: "🗣️", color: "hsl(142 76% 36%)", desc: "Og'zaki nutq amaliyoti" },
  { id: "vocab", name: "So'z Boyitish", emoji: "📚", color: "hsl(270 60% 55%)", desc: "Yangi so'zlar o'rganish" },
  { id: "cefr", name: "CEFR B2-C1", emoji: "🎯", color: "hsl(45 93% 47%)", desc: "Yuqori daraja mashqlari" },
];

export default function StudyRoom() {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", user: "Sardor", text: "Hammaga salom! Bugun IELTS writing practice boshlaymiz", time: "09:00" },
    { id: "2", user: "Aziza", text: "Tayyor! Writing task 2 dan boshlaylik", time: "09:01" },
  ]);
  const [newMsg, setNewMsg] = useState("");
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 20) + 5);
  const [focusGoal, setFocusGoal] = useState(25); // Pomodoro minutes
  const [ambientOn, setAmbientOn] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      user: user?.email?.split("@")[0] || "Mehmon",
      text: newMsg,
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(p => [...p, msg]);
    setNewMsg("");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const progress = Math.min((timer / (focusGoal * 60)) * 100, 100);

  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-bold mb-3">🏫 Live Study Rooms</h1>
            <p className="text-muted-foreground">Real-time boshqalar bilan birga o'qing va motivatsiya oling</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROOMS.map((room, i) => (
              <motion.button key={room.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => setActiveRoom(room.id)}
                className="card-elevated rounded-2xl p-6 text-left border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${room.color}20` }}>
                    {room.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold">{room.name}</h3>
                    <p className="text-xs text-muted-foreground">{room.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{Math.floor(Math.random() * 15) + 3} nafar online</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1 animate-pulse" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const room = ROOMS.find(r => r.id === activeRoom)!;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Timer + Stats */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card-elevated rounded-2xl p-6 text-center">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">{room.emoji} {room.name}</h2>
                <button onClick={() => setActiveRoom(null)} className="text-muted-foreground hover:text-foreground text-sm">← Chiq</button>
              </div>

              {/* Circular timer */}
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={room.color} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-mono font-bold">{fmt(timer)}</span>
                  <span className="text-xs text-muted-foreground">{focusGoal} daqiqa</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 mb-4">
                <button onClick={() => setIsRunning(r => !r)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${isRunning ? "bg-red-500/10 text-red-500" : "btn-primary"}`}
                >
                  {isRunning ? "⏸ Pauza" : "▶ Boshlash"}
                </button>
                <button onClick={() => { setTimer(0); setIsRunning(false); }} className="btn-outline px-4 py-2 text-sm">↺</button>
              </div>

              <div className="flex justify-center gap-2">
                {[25, 45, 60].map(m => (
                  <button key={m} onClick={() => { setFocusGoal(m); setTimer(0); setIsRunning(false); }}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${focusGoal === m ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  >{m}m</button>
                ))}
              </div>
            </motion.div>

            {/* Online users */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-elevated rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Online ({onlineCount})</h3>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                {["Sardor 🔥 45min", "Aziza ⚡ 23min", "Bobur 📖 12min", "Kamola 🎯 8min"].map((u, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{u[0]}</div>
                    <span className="text-muted-foreground text-xs">{u}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-1">...va {onlineCount - 4} ta boshqa</p>
              </div>
            </motion.div>
          </div>

          {/* Right: Chat */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 card-elevated rounded-2xl flex flex-col" style={{ height: 520 }}>
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-bold">💬 Xonalar chati</h3>
              <span className="text-xs text-muted-foreground">{messages.length} xabar</span>
            </div>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => {
                const isMe = msg.user === (user?.email?.split("@")[0] || "Mehmon");
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{msg.user[0].toUpperCase()}</div>
                    <div className={`max-w-xs ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <span className="text-[10px] text-muted-foreground mb-0.5">{msg.user} · {msg.time}</span>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 rounded-tl-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="p-4 border-t border-border/40 flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Xabar yozing..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={sendMessage} className="btn-primary px-4 py-2.5 rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
