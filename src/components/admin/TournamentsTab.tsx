import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Plus, Trash2, Users, Clock, CheckCircle,
  XCircle, Eye, Crown, Loader2, Calendar, Gift, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PRIZES: Record<number, string> = {
  1: '200,000 so\'m',
  2: '1 yillik Pro',
  3: '100,000 so\'m',
  4: '50,000 so\'m',
};
const getPrize = (rank: number) => {
  if (rank <= 4) return PRIZES[rank];
  if (rank <= 10) return '1 oylik Pro';
  if (rank <= 20) return '10,000 so\'m';
  return '—';
};

export const TournamentsTab = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, any[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState<string | null>(null);

  // New tournament form
  const [form, setForm] = useState({
    title: '',
    game_type: 'monthly',
    end_date: '',
    prize_xp: 500,
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data } = await (supabase.from('tournaments') as any)
      .select('*').order('created_at', { ascending: false });
    setTournaments(data || []);
    setLoading(false);
  };

  const createTournament = async () => {
    if (!form.title.trim()) { toast.error('Turnir nomini kiriting'); return; }
    if (!form.end_date) { toast.error('Tugash vaqtini kiriting'); return; }
    setCreating(true);
    const { error } = await (supabase.from('tournaments') as any).insert({
      title: form.title.trim(),
      game_type: form.game_type,
      end_date: new Date(form.end_date).toISOString(),
      prize_xp: form.prize_xp,
      status: 'active',
    });
    setCreating(false);
    if (error) { toast.error('Xato: ' + error.message); return; }
    toast.success('✅ Turnir yaratildi!');
    setShowForm(false);
    setForm({ title: '', game_type: 'monthly', end_date: '', prize_xp: 500 });
    fetchTournaments();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from('tournaments') as any)
      .update({ status }).eq('id', id);
    if (error) { toast.error('Xato yuz berdi'); return; }
    toast.success(status === 'active' ? '▶️ Faollashtirildi' : status === 'ended' ? '🏁 Tugatialdi' : '⏸ Pauza');
    fetchTournaments();
  };

  const deleteTournament = async (id: string) => {
    if (!confirm('Turnirni o\'chirishni tasdiqlaysizmi?')) return;
    await (supabase.from('tournament_participants') as any).delete().eq('tournament_id', id);
    const { error } = await (supabase.from('tournaments') as any).delete().eq('id', id);
    if (error) { toast.error('Xato yuz berdi'); return; }
    toast.success('🗑️ Turnir o\'chirildi');
    fetchTournaments();
  };

  const loadParticipants = async (tournamentId: string) => {
    if (participants[tournamentId]) {
      setExpandedId(expandedId === tournamentId ? null : tournamentId);
      return;
    }
    setLoadingParticipants(tournamentId);
    setExpandedId(tournamentId);

    const { data: parts } = await (supabase.from('tournament_participants') as any)
      .select('user_id, total_score, games_played')
      .eq('tournament_id', tournamentId)
      .order('total_score', { ascending: false });

    if (parts && parts.length > 0) {
      const { data: profiles } = await supabase.from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', parts.map((p: any) => p.user_id));

      const enriched = parts.map((p: any, i: number) => ({
        ...p,
        rank: i + 1,
        full_name: profiles?.find((pr: any) => pr.user_id === p.user_id)?.full_name || 'Foydalanuvchi',
        avatar_url: profiles?.find((pr: any) => pr.user_id === p.user_id)?.avatar_url,
        prize: getPrize(i + 1),
      }));
      setParticipants(prev => ({ ...prev, [tournamentId]: enriched }));
    } else {
      setParticipants(prev => ({ ...prev, [tournamentId]: [] }));
    }
    setLoadingParticipants(null);
  };

  const getTimeStatus = (endDate: string, status: string) => {
    if (status === 'ended') return { label: 'Tugagan', color: 'text-muted-foreground' };
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return { label: 'Muddati o\'tgan', color: 'text-red-500' };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return { label: `${days}k ${hours}s qoldi`, color: 'text-green-500' };
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">● Faol</span>;
    if (status === 'ended') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">✓ Tugagan</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">⏸ Pauza</span>;
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Turnirlar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Turnirlarni yarating va boshqaring</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Yangi Turnir
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="p-6 rounded-2xl border border-primary/30 bg-primary/5 mb-6 space-y-4">
            <h3 className="font-semibold text-base">Yangi turnir yaratish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Turnir nomi *</label>
                <input value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Masalan: Oylik Grand Turnir 🏆"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tur</label>
                <select value={form.game_type}
                  onChange={e => setForm(p => ({ ...p, game_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
                  <option value="monthly">📅 Oylik</option>
                  <option value="duel">⚔️ Duel</option>
                  <option value="group">👥 Guruhli</option>
                  <option value="all">🏆 Barcha turlar</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tugash vaqti *</label>
                <input type="datetime-local" value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bonus XP</label>
                <input type="number" value={form.prize_xp}
                  onChange={e => setForm(p => ({ ...p, prize_xp: +e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {/* Prize reminder */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              🏆 Mukofotlar: 1-o'rin 200k so'm · 2-o'rin 1 yillik Pro · 3-o'rin 100k so'm · 4-o'rin 50k so'm · 5-10 1 oylik Pro · 11-20 10k so'm
            </div>

            <div className="flex gap-3">
              <button onClick={createTournament} disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {creating ? 'Yaratilmoqda...' : 'Yaratish'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                Bekor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournaments List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Hali turnir yo'q</p>
          <p className="text-sm mt-1">Yuqoridagi tugmadan yangi turnir yarating</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => {
            const timeStatus = getTimeStatus(t.end_date, t.status);
            const isExpanded = expandedId === t.id;
            const parts = participants[t.id] || [];

            return (
              <motion.div key={t.id} layout
                className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Tournament header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-base">{t.title}</h3>
                        {statusBadge(t.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(t.end_date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${timeStatus.color}`}>
                          <Clock className="w-3 h-3" /> {timeStatus.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3 text-amber-500" /> {t.prize_xp} XP
                        </span>
                        <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-muted">
                          {t.game_type === 'monthly' ? '📅 Oylik' : t.game_type === 'duel' ? '⚔️ Duel' : t.game_type === 'group' ? '👥 Guruhli' : '🏆 Barcha'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.status === 'active' && (
                        <button onClick={() => updateStatus(t.id, 'ended')}
                          title="Tugatish"
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {t.status === 'ended' && (
                        <button onClick={() => updateStatus(t.id, 'active')}
                          title="Faollashtirish"
                          className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => loadParticipants(t.id)}
                        title="Ishtirokchilarni ko'rish"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors">
                        <Users className="w-3.5 h-3.5" />
                        <span>Ishtirokchilar</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button onClick={() => deleteTournament(t.id)}
                        title="O'chirish"
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="border-t border-border overflow-hidden">
                      {loadingParticipants === t.id ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : parts.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          Hali hech kim qatnashmagan
                        </div>
                      ) : (
                        <div>
                          <div className="px-5 py-3 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground font-medium">
                            <span>{parts.length} ishtirokchi</span>
                            <span>Ball · O'yin · Mukofot</span>
                          </div>
                          <div className="divide-y divide-border max-h-80 overflow-y-auto">
                            {parts.map((p, i) => (
                              <div key={p.user_id}
                                className={`flex items-center gap-3 px-5 py-3 ${i < 3 ? 'bg-amber-500/3' : ''}`}>
                                <div className="w-7 text-center flex-shrink-0">
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                                    <span className="text-xs text-muted-foreground">#{p.rank}</span>
                                  )}
                                </div>
                                <Avatar className="w-7 h-7 flex-shrink-0">
                                  <AvatarImage src={p.avatar_url || ''} />
                                  <AvatarFallback className="text-[10px]">{p.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{p.full_name}</p>
                                </div>
                                <div className="text-right text-xs flex-shrink-0 space-y-0.5">
                                  <p className="font-bold text-primary">{p.total_score?.toLocaleString() || 0} ball</p>
                                  <p className="text-muted-foreground">{p.games_played} o'yin</p>
                                </div>
                                <div className="w-28 text-right flex-shrink-0">
                                  <span className={`text-xs font-medium ${i < 4 ? 'text-amber-600 dark:text-amber-400' : i < 10 ? 'text-blue-500' : i < 20 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    {p.prize}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
