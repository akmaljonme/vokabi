import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, Flame, Gamepad2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  total_score: number;
  games_played: number;
}

const GAME_TYPES = [
  { value: 'all', label: 'Barcha o\'yinlar', icon: '🎮' },
  { value: 'word_match', label: 'Word Match', icon: '🔗' },
  { value: 'spelling_bee', label: 'Spelling Bee', icon: '🐝' },
  { value: 'grammar_battle', label: 'Grammar Battle', icon: '⚔️' },
  { value: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { value: 'hangman', label: 'Hangman', icon: '💀' },
  { value: 'sentence_builder', label: 'Sentence Builder', icon: '📝' },
  { value: 'listening_quiz', label: 'Listening Quiz', icon: '🎧' },
  { value: 'idiom_master', label: 'Idiom Master', icon: '🎭' },
  { value: 'last_word', label: 'Last Word', icon: '🔤' },
];

const PERIODS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'week', label: 'Bu hafta' },
  { value: 'month', label: 'Bu oy' },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [gameFilter, periodFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase.from('game_scores').select('user_id, score, game_type, created_at');

      if (gameFilter !== 'all') {
        query = query.eq('game_type', gameFilter);
      }

      if (periodFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (periodFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data: scores, error } = await query;
      if (error) throw error;

      // Aggregate scores by user
      const userMap: Record<string, { total_score: number; games_played: number }> = {};
      (scores || []).forEach((s: any) => {
        if (!userMap[s.user_id]) userMap[s.user_id] = { total_score: 0, games_played: 0 };
        userMap[s.user_id].total_score += s.score;
        userMap[s.user_id].games_played += 1;
      });

      const userIds = Object.keys(userMap);
      if (userIds.length === 0) { setEntries([]); setMyRank(null); setLoading(false); return; }

      // Fetch profiles
      const { data: profiles } = await (supabase.from('profiles') as any)
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

      const leaderboard: LeaderboardEntry[] = userIds.map(uid => ({
        user_id: uid,
        full_name: profileMap[uid]?.full_name || null,
        username: profileMap[uid]?.username || null,
        avatar_url: profileMap[uid]?.avatar_url || null,
        total_score: userMap[uid].total_score,
        games_played: userMap[uid].games_played,
      })).sort((a, b) => b.total_score - a.total_score);

      setEntries(leaderboard);

      if (user) {
        const rank = leaderboard.findIndex(e => e.user_id === user.id);
        setMyRank(rank >= 0 ? rank + 1 : null);
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/10 border-amber-500/30';
    if (rank === 2) return 'bg-slate-500/5 border-slate-400/20';
    if (rank === 3) return 'bg-amber-700/5 border-amber-700/20';
    return 'border-border/50';
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.username) return `@${entry.username}`;
    return entry.full_name || 'Foydalanuvchi';
  };

  const getInitials = (entry: LeaderboardEntry) => {
    if (entry.username) return entry.username[0].toUpperCase();
    if (entry.full_name) return entry.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return '?';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/games')} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">Leaderboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* My rank banner */}
        {user && myRank && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Sizning o'rningiz</p>
                <p className="text-xs text-muted-foreground">{entries.find(e => e.user_id === user.id)?.games_played || 0} ta o'yin</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-primary">#{myRank}</p>
              <p className="text-xs text-muted-foreground">{entries.find(e => e.user_id === user.id)?.total_score || 0} ball</p>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="flex-1 rounded-xl">
              <SelectValue placeholder="O'yin turi" />
            </SelectTrigger>
            <SelectContent>
              {GAME_TYPES.map(g => (
                <SelectItem key={g.value} value={g.value}>
                  <span className="flex items-center gap-2">{g.icon} {g.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue placeholder="Davr" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Hali natijalar yo'q</p>
            <p className="text-sm text-muted-foreground">O'yin o'ynab, birinchi bo'ling!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 podium */}
            {entries.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-8 pt-4">
                {/* 2nd place */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-center flex-1 max-w-[120px]">
                  <Avatar className="w-14 h-14 mx-auto mb-2 ring-2 ring-slate-400">
                    <AvatarImage src={entries[1].avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{getInitials(entries[1])}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-semibold truncate">{getDisplayName(entries[1])}</p>
                  <p className="text-xs text-muted-foreground">{entries[1].total_score}</p>
                  <div className="mt-2 h-16 bg-slate-200 dark:bg-slate-800 rounded-t-xl flex items-center justify-center">
                    <Medal className="w-5 h-5 text-slate-400" />
                  </div>
                </motion.div>

                {/* 1st place */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center flex-1 max-w-[130px]">
                  <div className="relative">
                    <Avatar className="w-16 h-16 mx-auto mb-2 ring-2 ring-amber-500">
                      <AvatarImage src={entries[0].avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-50 text-amber-600 font-bold text-lg">{getInitials(entries[0])}</AvatarFallback>
                    </Avatar>
                    <Crown className="w-5 h-5 text-amber-500 absolute -top-2 left-1/2 -translate-x-1/2" />
                  </div>
                  <p className="text-sm font-bold truncate">{getDisplayName(entries[0])}</p>
                  <p className="text-xs text-muted-foreground">{entries[0].total_score}</p>
                  <div className="mt-2 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-t-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                </motion.div>

                {/* 3rd place */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-center flex-1 max-w-[120px]">
                  <Avatar className="w-14 h-14 mx-auto mb-2 ring-2 ring-amber-700">
                    <AvatarImage src={entries[2].avatar_url || undefined} />
                    <AvatarFallback className="bg-amber-50 text-amber-700 font-bold">{getInitials(entries[2])}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-semibold truncate">{getDisplayName(entries[2])}</p>
                  <p className="text-xs text-muted-foreground">{entries[2].total_score}</p>
                  <div className="mt-2 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-t-xl flex items-center justify-center">
                    <Medal className="w-5 h-5 text-amber-700" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Full list */}
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.user_id === user?.id;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${getRankBg(rank)} ${isMe ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className="w-7 flex justify-center shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{getInitials(entry)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : ''}`}>
                      {getDisplayName(entry)} {isMe && <span className="text-xs font-normal text-muted-foreground">(siz)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.games_played} o'yin</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{entry.total_score.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">ball</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
