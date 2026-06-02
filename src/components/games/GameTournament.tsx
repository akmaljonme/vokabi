import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Zap, Crown, Medal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Tournament {
  id: string;
  title: string;
  game_type: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_xp: number;
}

interface Participant {
  user_id: string;
  total_score: number;
  games_played: number;
  full_name?: string;
  avatar_url?: string;
}

interface Props { onBack: () => void; }

export const GameTournament = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data } = await (supabase.from('tournaments') as any)
      .select('*').eq('status', 'active').order('end_date', { ascending: true });
    
    if (data && data.length > 0) {
      setTournaments(data);
      loadTournament(data[0]);
    } else {
      // Create a default weekly tournament if none exists
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      const { data: newT } = await (supabase.from('tournaments') as any).insert({
        title: "Haftalik Grand Turnir 🏆",
        game_type: 'all',
        end_date: endDate.toISOString(),
        prize_xp: 500,
      }).select().single();
      if (newT) {
        setTournaments([newT]);
        loadTournament(newT);
      }
    }
    setLoading(false);
  };

  const loadTournament = async (t: Tournament) => {
    setSelectedTournament(t);
    const { data: parts } = await (supabase.from('tournament_participants') as any)
      .select('user_id, total_score, games_played')
      .eq('tournament_id', t.id)
      .order('total_score', { ascending: false })
      .limit(50);

    if (parts && parts.length > 0) {
      // Fetch profiles
      const userIds = parts.map((p: any) => p.user_id);
      const { data: profiles } = await supabase.from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const enriched = parts.map((p: any) => {
        const profile = profiles?.find(pr => pr.user_id === p.user_id);
        return { ...p, full_name: profile?.full_name, avatar_url: profile?.avatar_url };
      });
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
    if (!user || !selectedTournament) return;
    const { error } = await (supabase.from('tournament_participants') as any).insert({
      tournament_id: selectedTournament.id,
      user_id: user.id,
    });
    if (error) {
      if (error.code === '23505') toast({ title: "Siz allaqachon qatnashyapsiz!" });
      else toast({ title: "Xato yuz berdi", variant: 'destructive' });
      return;
    }
    setIsJoined(true);
    toast({ title: "🎉 Turnirga qo'shildingiz!" });
    loadTournament(selectedTournament);
  };

  const getTimeRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return "Tugagan";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}k ${hours}s qoldi`;
  };

  const getRankIcon = (idx: number) => {
    if (idx === 0) return <Crown className="w-5 h-5 text-amber-500" />;
    if (idx === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (idx === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
        <p className="text-sm text-muted-foreground mt-4">Turnirlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Turnirlar
          </h2>
          <p className="text-sm text-muted-foreground">Haftalik musobaqa — eng ko'p ball to'plang!</p>
        </div>
        <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
      </div>

      {selectedTournament && (
        <>
          {/* Tournament Card */}
          <div className="card-elevated p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-primary/5" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedTournament.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {getTimeRemaining(selectedTournament.end_date)}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {participants.length} ishtirokchi</span>
                    <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-amber-500" /> {selectedTournament.prize_xp} XP sovrin</span>
                  </div>
                </div>
                {!isJoined ? (
                  <Button onClick={joinTournament} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    Qatnashish
                  </Button>
                ) : (
                  <span className="text-sm font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    ✅ Qatnashyapsiz {myRank && `(#${myRank})`}
                  </span>
                )}
              </div>

              {isJoined && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  💡 Istalgan o'yinni o'ynab ball to'plang — natijalaringiz avtomatik turnirga qo'shiladi!
                </p>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" /> Reyting</h3>
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Hali hech kim qatnashmagan</p>
                <p className="text-sm mt-1">Birinchi bo'ling! 🚀</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-3 px-4 ${p.user_id === user?.id ? 'bg-primary/5' : ''}`}
                  >
                    {getRankIcon(i)}
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatar_url || ''} />
                      <AvatarFallback className="text-xs">{(p.full_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name || 'Foydalanuvchi'}</p>
                      <p className="text-xs text-muted-foreground">{p.games_played} o'yin</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{p.total_score}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};
