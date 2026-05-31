import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Trophy, Crown, Medal, Clock, Users, Zap, Star,
  ArrowLeft, Loader2, Gift, CheckCircle, Sword, Calendar, ChevronRight
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Mukofotlar ──────────────────────────────────────────────────────────────
const PRIZES = [
  { place: "1", icon: "🥇", label: "1-o'rin", reward: "200,000 so'm", color: "from-amber-400 to-yellow-500", textColor: "text-amber-600 dark:text-amber-400" },
  { place: "2", icon: "🥈", label: "2-o'rin", reward: "1 yillik Pro", color: "from-slate-400 to-slate-500", textColor: "text-slate-500 dark:text-slate-300" },
  { place: "3", icon: "🥉", label: "3-o'rin", reward: "100,000 so'm", color: "from-amber-600 to-orange-700", textColor: "text-amber-700 dark:text-amber-600" },
  { place: "4", icon: "🎖️", label: "4-o'rin", reward: "50,000 so'm", color: "from-purple-400 to-violet-500", textColor: "text-purple-600 dark:text-purple-400" },
  { place: "5-10", icon: "🎁", label: "5–10-o'rin", reward: "1 oylik Pro", color: "from-blue-400 to-blue-500", textColor: "text-blue-600 dark:text-blue-400" },
  { place: "11-20", icon: "💰", label: "11–20-o'rin", reward: "10,000 so'm", color: "from-green-400 to-emerald-500", textColor: "text-green-600 dark:text-green-400" },
];

const TOURNAMENT_TYPES = [
  { key: "monthly", label: "Oylik", icon: "📅", desc: "Har oy, hamma ishtirok etadi", soon: false },
  { key: "duel", label: "Duel", icon: "⚔️", desc: "2 kishi real vaqtda test yechadi", soon: true },
  { key: "group", label: "Guruhli", icon: "👥", desc: "4–8 kishi, eng ko'p ball g'olib", soon: true },
];

type TView = "list" | "detail";

export default function Tournaments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<TView>("list");
  const [activeType, setActiveType] = useState("monthly");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data } = await (supabase.from("tournaments") as any)
      .select("*").eq("status", "active").order("end_date", { ascending: true });

    if (data && data.length > 0) {
      setTournaments(data);
      selectTournament(data[0]);
    } else {
      // Avtomatik oylik turnir yaratish
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const { data: newT } = await (supabase.from("tournaments") as any).insert({
        title: "Oylik Grand Turnir 🏆",
        game_type: "monthly",
        end_date: endDate.toISOString(),
        prize_xp: 500,
        status: "active",
      }).select().single();
      if (newT) {
        setTournaments([newT]);
        selectTournament(newT);
      }
    }
    setLoading(false);
  };

  const selectTournament = async (t: any) => {
    setSelected(t);
    const { data: parts } = await (supabase.from("tournament_participants") as any)
      .select("user_id, total_score, games_played")
      .eq("tournament_id", t.id)
      .order("total_score", { ascending: false })
      .limit(100);

    if (parts && parts.length > 0) {
      const userIds = parts.map((p: any) => p.user_id);
      const { data: profiles } = await supabase.from("profiles")
        .select("user_id, full_name, avatar_url").in("user_id", userIds);
      const enriched = parts.map((p: any) => ({
        ...p,
        full_name: profiles?.find((pr: any) => pr.user_id === p.user_id)?.full_name,
        avatar_url: profiles?.find((pr: any) => pr.user_id === p.user_id)?.avatar_url,
      }));
      setParticipants(enriched);
      if (user) {
        const idx = enriched.findIndex((p: any) => p.user_id === user.id);
        setMyRank(idx >= 0 ? idx + 1 : null);
        setIsJoined(idx >= 0);
      }
    } else {
      setParticipants([]);
      setIsJoined(false);
      setMyRank(null);
    }
  };

  const joinTournament = async () => {
    if (!user) { toast.error("Iltimos, tizimga kiring"); navigate("/login"); return; }
    if (!selected) return;
    setJoining(true);
    const { error } = await (supabase.from("tournament_participants") as any).insert({
      tournament_id: selected.id, user_id: user.id, total_score: 0, games_played: 0,
    });
    setJoining(false);
    if (error) {
      if (error.code === "23505") toast.error("Siz allaqachon qatnashyapsiz!");
      else toast.error("Xato yuz berdi");
      return;
    }
    setIsJoined(true);
    toast.success("🎉 Turnirga qo'shildingiz! O'yinlar o'ynab ball to'plang!");
    selectTournament(selected);
  };

  const getTimeRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return "Tugagan";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days} kun ${hours} soat qoldi`;
    if (hours > 0) return `${hours} soat ${mins} daqiqa qoldi`;
    return `${mins} daqiqa qoldi`;
  };

  const getRankBadge = (i: number) => {
    if (i === 0) return <span className="text-xl">🥇</span>;
    if (i === 1) return <span className="text-xl">🥈</span>;
    if (i === 2) return <span className="text-xl">🥉</span>;
    if (i <= 3) return <span className="text-sm font-bold text-purple-500">#{i + 1}</span>;
    if (i <= 9) return <span className="text-sm font-bold text-blue-500">#{i + 1}</span>;
    if (i <= 19) return <span className="text-sm font-bold text-green-500">#{i + 1}</span>;
    return <span className="text-sm text-muted-foreground">#{i + 1}</span>;
  };

  const getPrizeForRank = (rank: number) => {
    if (rank === 1) return "200,000 so'm 💰";
    if (rank === 2) return "1 yillik Pro 👑";
    if (rank === 3) return "100,000 so'm 💰";
    if (rank === 4) return "50,000 so'm 💰";
    if (rank <= 10) return "1 oylik Pro 🎁";
    if (rank <= 20) return "10,000 so'm 💰";
    return null;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
            🏆
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Turnirlar</h1>
            <p className="text-sm text-muted-foreground">Musobaqa, g'olib bo'l, mukofot ol!</p>
          </div>
        </div>

        {/* Prize Table */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Mukofotlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PRIZES.map((p) => (
              <motion.div key={p.place} whileHover={{ y: -3 }}
                className="relative p-4 rounded-2xl border border-border bg-card text-center overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-5`} />
                <div className="text-3xl mb-2">{p.icon}</div>
                <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
                <div className={`text-xs font-bold ${p.textColor}`}>{p.reward}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tournament types */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TOURNAMENT_TYPES.map(t => (
            <button key={t.key}
              onClick={() => !t.soon && setActiveType(t.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                t.soon
                  ? "bg-card border border-border opacity-60 cursor-not-allowed"
                  : activeType === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:border-primary/40"
              }`}>
              <span>{t.icon}</span>
              {t.label}
              {t.soon && (
                <span className="ml-1 text-[10px] font-semibold bg-amber-400/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                  Tez orada
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Tournament Card */}
            <div className="lg:col-span-2 space-y-4">
              {selected ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl border border-border bg-card relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-primary/5" />
                  <div className="relative space-y-4">
                    <div>
                      <h3 className="text-lg font-bold">{selected.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getTimeRemaining(selected.end_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {participants.length} ishtirokchi
                        </span>
                      </div>
                    </div>

                    {/* My rank */}
                    {isJoined && myRank && (
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Sizning o'rningiz</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-display font-bold text-primary">#{myRank}</span>
                          {getPrizeForRank(myRank) && (
                            <span className="text-xs font-medium text-green-500">
                              {getPrizeForRank(myRank)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Join / Joined */}
                    {!isJoined ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={joinTournament} disabled={joining}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                        {joining ? "Qo'shilmoqda..." : "Turnirga Qo'shilish"}
                      </motion.button>
                    ) : (
                      <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 font-medium text-center text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Qatnashyapsiz!
                      </div>
                    )}

                    {isJoined && (
                      <p className="text-xs text-muted-foreground text-center">
                        💡 O'yinlar o'ynab ball to'plang — natijalar avtomatik qo'shiladi
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 rounded-2xl border border-border bg-card text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Faol turnir yo'q</p>
                </div>
              )}

              {/* How it works */}
              <div className="p-5 rounded-2xl border border-border bg-card">
                <h4 className="font-semibold mb-3 text-sm">Qanday ishlaydi?</h4>
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Turnirga qo'shiling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>O'yinlar o'ynang, testlar yeching — ball to'plang</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">3.</span>
                    <span>Oy oxirida eng yuqori balllılar mukofot oladi</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">4.</span>
                    <span>Mukofot Telegram orqali yuboriladi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Leaderboard */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" /> Reyting
                  </h3>
                  <span className="text-xs text-muted-foreground">{participants.length} ishtirokchi</span>
                </div>

                {participants.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Hali hech kim qatnashmagan</p>
                    <p className="text-sm mt-1">Birinchi bo'ling! 🚀</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                    {participants.map((p, i) => {
                      const isMe = p.user_id === user?.id;
                      const prize = getPrizeForRank(i + 1);
                      return (
                        <motion.div key={p.user_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                        >
                          <div className="w-7 flex items-center justify-center flex-shrink-0">
                            {getRankBadge(i)}
                          </div>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={p.avatar_url || ""} />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {(p.full_name || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : ""}`}>
                              {p.full_name || "Foydalanuvchi"} {isMe && "(Siz)"}
                            </p>
                            {prize && (
                              <p className="text-xs text-muted-foreground">{prize}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-primary">{p.total_score?.toLocaleString() || 0}</p>
                            <p className="text-xs text-muted-foreground">{p.games_played} o'yin</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
