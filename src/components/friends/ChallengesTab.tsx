import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Swords, Check, X, Trophy, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { toast } from "sonner";
import {
  CHALLENGE_SKILLS,
  CHALLENGE_WINNER_XP,
  isChallengeExpired,
} from "@/lib/friendChallenge";
import { ChallengeQuizModal } from "./ChallengeQuizModal";

interface ChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  skill: string;
  status: string;
  questions: any[];
  challenger_score: number | null;
  opponent_score: number | null;
  winner_id: string | null;
  challenger_bonus_claimed: boolean;
  opponent_bonus_claimed: boolean;
  created_at: string;
  expires_at: string;
  challenger_name?: string;
  opponent_name?: string;
}

export const ChallengesTab = () => {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingChallenge, setPlayingChallenge] = useState<ChallengeRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("friend_challenges")
      .select("*")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const rows = (data || []) as ChallengeRow[];
    const ids = Array.from(
      new Set(rows.flatMap((r) => [r.challenger_id, r.opponent_id])),
    );
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      rows.forEach((r) => {
        r.challenger_name = profiles?.find((p: any) => p.user_id === r.challenger_id)?.full_name || "Foydalanuvchi";
        r.opponent_name = profiles?.find((p: any) => p.user_id === r.opponent_id)?.full_name || "Foydalanuvchi";
      });
    }
    setChallenges(rows);
    setLoading(false);

    // Yutgan, lekin bonusni hali olmagan challengelar uchun XP beramiz
    for (const c of rows) {
      if (c.status !== "completed" || c.winner_id !== user.id) continue;
      const isChallenger = c.challenger_id === user.id;
      const claimed = isChallenger ? c.challenger_bonus_claimed : c.opponent_bonus_claimed;
      if (claimed) continue;
      await addXP(CHALLENGE_WINNER_XP);
      await supabase
        .from("friend_challenges")
        .update(isChallenger ? { challenger_bonus_claimed: true } : { opponent_bonus_claimed: true })
        .eq("id", c.id);
      toast.success(`🏆 G'alaba! +${CHALLENGE_WINNER_XP} XP`);
    }
  }, [user, addXP]);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id: string, accept: boolean) => {
    setBusyId(id);
    await supabase
      .from("friend_challenges")
      .update({ status: accept ? "active" : "declined" })
      .eq("id", id);
    setBusyId(null);
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
      </div>
    );
  }

  const incoming = challenges.filter(
    (c) => c.status === "pending" && c.opponent_id === user?.id && !isChallengeExpired(c.expires_at),
  );
  const waitingForOthers = challenges.filter(
    (c) => c.status === "pending" && c.challenger_id === user?.id && !isChallengeExpired(c.expires_at),
  );
  const active = challenges.filter((c) => c.status === "active" && !isChallengeExpired(c.expires_at));
  const completed = challenges.filter((c) => c.status === "completed");

  const myScoreDone = (c: ChallengeRow) =>
    (c.challenger_id === user?.id ? c.challenger_score : c.opponent_score) !== null;

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Hali challenge yo'q</p>
        <p className="text-sm mt-1">Do'stlar ro'yxatidan birortasiga challenge tashlang!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Kelgan challengelar
          </p>
          <div className="space-y-2">
            {incoming.map((c) => (
              <div key={c.id} className="card-elevated p-3 flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{c.challenger_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.challenger_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {CHALLENGE_SKILLS.find((s) => s.key === c.skill)?.emoji}{" "}
                    {CHALLENGE_SKILLS.find((s) => s.key === c.skill)?.label} challenge
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-8" disabled={busyId === c.id} onClick={() => respond(c.id, true)}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" disabled={busyId === c.id} onClick={() => respond(c.id, false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Faol</p>
          <div className="space-y-2">
            {active.map((c) => {
              const opponentName = c.challenger_id === user?.id ? c.opponent_name : c.challenger_name;
              const done = myScoreDone(c);
              return (
                <div key={c.id} className="card-elevated p-3 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{opponentName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{opponentName} bilan</p>
                    <p className="text-xs text-muted-foreground">
                      {done ? "Do'stingiz kutilmoqda..." : "Sizning navbatingiz!"}
                    </p>
                  </div>
                  {!done && (
                    <Button size="sm" className="h-8 shrink-0" onClick={() => setPlayingChallenge(c)}>
                      <Swords className="w-3.5 h-3.5 mr-1" /> O'ynash
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {waitingForOthers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Javob kutilmoqda
          </p>
          <div className="space-y-2">
            {waitingForOthers.map((c) => (
              <div key={c.id} className="card-elevated p-3 flex items-center gap-3 opacity-75">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{c.opponent_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.opponent_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Javob kutilmoqda
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Yakunlangan</p>
          <div className="space-y-2">
            {completed.map((c) => {
              const iWon = c.winner_id === user?.id;
              const isDraw = c.winner_id === null;
              const opponentName = c.challenger_id === user?.id ? c.opponent_name : c.challenger_name;
              const myScore = c.challenger_id === user?.id ? c.challenger_score : c.opponent_score;
              const theirScore = c.challenger_id === user?.id ? c.opponent_score : c.challenger_score;
              return (
                <div key={c.id} className="card-elevated p-3 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      iWon ? "bg-emerald-500/15 text-emerald-500" : isDraw ? "bg-muted text-muted-foreground" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {iWon ? <Trophy className="w-5 h-5" /> : isDraw ? "🤝" : "😔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{opponentName} bilan</p>
                    <p className="text-xs text-muted-foreground">
                      {myScore}/{c.questions.length} vs {theirScore}/{c.questions.length}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      iWon ? "text-emerald-500" : isDraw ? "text-muted-foreground" : "text-red-500"
                    }`}
                  >
                    {iWon ? "G'alaba!" : isDraw ? "Durrang" : "Mag'lubiyat"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {playingChallenge && (
          <ChallengeQuizModal
            challenge={playingChallenge}
            onClose={() => setPlayingChallenge(null)}
            onDone={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
