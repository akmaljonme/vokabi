import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Headphones, PenLine, Mic, CheckCircle2, Loader2, Gift, Sparkles, Bomb } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const supabase: any = _sb;

interface Props {
  tournamentId: string;
  participantId?: string;
  onXPCommitted?: () => void;
}

const TASKS = [
  { key: "reading_done",   label: "Reading",   icon: BookOpen,   color: "from-blue-500 to-cyan-500",   route: "/games", desc: "1 ta Reading o'yini / test" },
  { key: "listening_done", label: "Listening", icon: Headphones, color: "from-purple-500 to-pink-500", route: "/games", desc: "1 ta Listening mashqi" },
  { key: "writing_done",   label: "Writing",   icon: PenLine,    color: "from-emerald-500 to-teal-500", route: "/tools", desc: "1 ta Writing mashqi" },
  { key: "speaking_done",  label: "Speaking",  icon: Mic,        color: "from-amber-500 to-orange-500", route: "/community", desc: "1 ta Speaking mashqi" },
] as const;

const TASK_XP = 25; // each task

type BoxResult = "bonus_small" | "bonus_big" | "bomb";
const BOX_LABELS: Record<BoxResult, { label: string; icon: any; color: string; xp: number }> = {
  bonus_small: { label: "Bonus +50 XP",  icon: Gift,      color: "text-emerald-500", xp: 50 },
  bonus_big:   { label: "BOMBA +150 XP", icon: Sparkles,  color: "text-amber-500",   xp: 150 },
  bomb:        { label: "Bomba! XP yondi", icon: Bomb,    color: "text-rose-500",    xp: 0 },
};

export const TournamentDailyTasks = ({ tournamentId, participantId, onXPCommitted }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any>(null);
  const [opening, setOpening] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { if (user && tournamentId) load(); /* eslint-disable-next-line */ }, [user, tournamentId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tournament_daily_progress")
      .select("*")
      .eq("user_id", user!.id)
      .eq("tournament_id", tournamentId)
      .eq("task_date", today)
      .maybeSingle();

    if (!data) {
      const { data: created } = await supabase
        .from("tournament_daily_progress")
        .insert({ user_id: user!.id, tournament_id: tournamentId, task_date: today })
        .select().single();
      setRow(created);
    } else {
      setRow(data);
    }
    setLoading(false);
  };

  const toggleTask = async (key: string) => {
    if (!row || row[key] || row.box_opened) return;
    const updates: any = { [key]: true, daily_xp: (row.daily_xp || 0) + TASK_XP };
    const { data } = await supabase
      .from("tournament_daily_progress")
      .update(updates).eq("id", row.id).select().single();
    if (data) {
      setRow(data);
      toast.success(`+${TASK_XP} XP — ${key.replace("_done", "")} bajarildi!`);
    }
  };

  const allDone = row && TASKS.every(t => row[t.key]);

  const openBox = async (idx: number) => {
    if (!row || !allDone || row.box_opened) return;
    setOpening(idx);

    // Shuffle: 2 bonuses + 1 bomb in random positions
    const pool: BoxResult[] = ["bonus_small", "bonus_big", "bomb"].sort(() => Math.random() - 0.5) as BoxResult[];
    const result = pool[idx];
    const info = BOX_LABELS[result];

    let finalXP = row.daily_xp;
    if (result === "bomb") finalXP = 0;
    else finalXP = (row.daily_xp || 0) + info.xp;

    // Commit to tournament_participants
    if (participantId && finalXP > 0) {
      const { data: p } = await supabase
        .from("tournament_participants")
        .select("total_score, games_played").eq("id", participantId).maybeSingle();
      if (p) {
        await supabase
          .from("tournament_participants")
          .update({
            total_score: (p.total_score || 0) + finalXP,
            games_played: (p.games_played || 0) + 1,
          })
          .eq("id", participantId);
      }
    }

    const { data: upd } = await supabase
      .from("tournament_daily_progress")
      .update({ box_opened: true, box_result: result, daily_xp: finalXP, committed: true })
      .eq("id", row.id).select().single();

    setRow(upd);
    setTimeout(() => setOpening(null), 1200);

    if (result === "bomb") toast.error("💥 Bomba! Bugungi XP yondi");
    else toast.success(`🎁 ${info.label}!`);

    onXPCommitted?.();
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-border bg-card flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!row) return null;

  const doneCount = TASKS.filter(t => row[t.key]).length;
  const result: BoxResult | null = row.box_result || null;

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2">
            🎯 Kunlik Vazifalar
          </h4>
          <p className="text-xs text-muted-foreground">{doneCount}/4 bajarildi · {row.daily_xp} XP</p>
        </div>
        {row.committed && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted">Bugun yakunlandi</span>
        )}
      </div>

      {/* 4 Skill tasks */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TASKS.map(t => {
          const done = row[t.key];
          const Icon = t.icon;
          return (
            <motion.button
              key={t.key}
              whileHover={!done && !row.box_opened ? { scale: 1.02 } : {}}
              whileTap={!done && !row.box_opened ? { scale: 0.98 } : {}}
              onClick={() => done ? navigate(t.route) : toggleTask(t.key)}
              disabled={row.box_opened && !done}
              className={`relative p-3 rounded-xl border text-left overflow-hidden transition-all ${
                done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/40"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-5`} />
              <div className="relative flex items-start gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${t.color} text-white flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold flex items-center gap-1">
                    {t.label}
                    {done && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{t.desc}</p>
                  <p className="text-[10px] font-medium text-primary mt-0.5">+{TASK_XP} XP</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mystery boxes */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4 border-t border-border"
          >
            <p className="text-xs font-bold text-center mb-1">
              {row.box_opened ? "Natijangiz" : "🎁 Bir sandiqni tanlang"}
            </p>
            <p className="text-[10px] text-center text-muted-foreground mb-3">
              {row.box_opened
                ? "Ertaga yangi vazifalar"
                : "2 ta bonus · 1 ta bomba 💣 (XP yonadi)"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(i => {
                const isChosen = row.box_opened && opening === i;
                const showResult = row.box_opened;
                const Icon = showResult && result ? BOX_LABELS[result].icon : Gift;
                return (
                  <motion.button
                    key={i}
                    whileHover={!row.box_opened ? { y: -4, scale: 1.05 } : {}}
                    whileTap={!row.box_opened ? { scale: 0.95 } : {}}
                    animate={isChosen ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] } : {}}
                    onClick={() => openBox(i)}
                    disabled={row.box_opened}
                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      row.box_opened
                        ? result === "bomb"
                          ? "border-rose-500/40 bg-rose-500/5"
                          : "border-emerald-500/40 bg-emerald-500/5"
                        : "border-dashed border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${showResult && result ? BOX_LABELS[result].color : "text-primary"}`} />
                    {!row.box_opened && <span className="text-[10px] font-bold">?</span>}
                  </motion.button>
                );
              })}
            </div>
            {row.box_opened && result && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`text-center text-sm font-bold mt-3 ${BOX_LABELS[result].color}`}
              >
                {BOX_LABELS[result].label} · Yakuniy: {row.daily_xp} XP
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};