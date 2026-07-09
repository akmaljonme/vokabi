import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Check, X, Trophy, Loader2, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ChallengeCreateModal } from '@/components/friends/ChallengeCreateModal';
import { ChallengesTab } from '@/components/friends/ChallengesTab';
import { FollowButton } from '@/components/friends/FollowButton';
import { createNotification } from '@/lib/notifications';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  full_name?: string;
  avatar_url?: string;
  xp?: number;
  level?: number;
}

interface Props { onBack: () => void; }

export const GameFriends = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'friends' | 'requests' | 'search' | 'challenges'>('friends');
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user) loadFriends();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    setLoading(true);

    // Get accepted friendships
    const { data: friendships } = await (supabase.from('friendships') as any)
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    // Get pending requests TO me
    const { data: pending } = await (supabase.from('friendships') as any)
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (friendships) {
      const friendIds = friendships.map((f: any) => f.user_id === user.id ? f.friend_id : f.user_id);
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles')
          .select('user_id, full_name, avatar_url').in('user_id', friendIds);
        const { data: progress } = await (supabase.from('user_progress') as any)
          .select('user_id, xp, level').in('user_id', friendIds);

        const enriched = friendships.map((f: any) => {
          const fid = f.user_id === user.id ? f.friend_id : f.user_id;
          const p = profiles?.find(pr => pr.user_id === fid);
          const pr = progress?.find((pr: any) => pr.user_id === fid);
          return { ...f, full_name: p?.full_name, avatar_url: p?.avatar_url, xp: pr?.xp || 0, level: pr?.level || 1 };
        });
        setFriends(enriched);
      } else {
        setFriends([]);
      }
    }

    if (pending && pending.length > 0) {
      const senderIds = pending.map((p: any) => p.user_id);
      const { data: profiles } = await supabase.from('profiles')
        .select('user_id, full_name, avatar_url').in('user_id', senderIds);
      const enriched = pending.map((p: any) => {
        const pr = profiles?.find(pf => pf.user_id === p.user_id);
        return { ...p, full_name: pr?.full_name, avatar_url: pr?.avatar_url };
      });
      setPendingRequests(enriched);
    } else {
      setPendingRequests([]);
    }

    setLoading(false);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase.from('profiles')
      .select('user_id, full_name, avatar_url, username')
      .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .neq('user_id', user.id)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (friendId: string) => {
    if (!user) return;
    const { error } = await (supabase.from('friendships') as any).insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending',
    });
    if (error) {
      if (error.code === '23505') toast({ title: "So'rov allaqachon yuborilgan" });
      else toast({ title: "Xato", variant: 'destructive' });
      return;
    }
    toast({ title: "✅ Do'stlik so'rovi yuborildi!" });
    createNotification({
      userId: friendId,
      actorId: user.id,
      type: 'friend_request',
      title: "Yangi do'stlik so'rovi",
      body: "Sizga do'stlik so'rovi yubordi",
    });
    setSearchResults(prev => prev.filter(r => r.user_id !== friendId));
  };

  const acceptRequest = async (friendshipId: string, requesterId: string) => {
    await (supabase.from('friendships') as any).update({ status: 'accepted' }).eq('id', friendshipId);
    toast({ title: "🤝 Do'st bo'ldingiz!" });
    if (user) {
      createNotification({
        userId: requesterId,
        actorId: user.id,
        type: 'friend_accepted',
        title: "Do'stlik so'rovi qabul qilindi!",
        body: "Endi siz do'stsiz 🎉",
      });
    }
    loadFriends();
  };

  const rejectRequest = async (friendshipId: string) => {
    await (supabase.from('friendships') as any).delete().eq('id', friendshipId);
    toast({ title: "So'rov rad etildi" });
    loadFriends();
  };

  const removeFriend = async (friendshipId: string) => {
    await (supabase.from('friendships') as any).delete().eq('id', friendshipId);
    toast({ title: "Do'st o'chirildi" });
    loadFriends();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Do'stlar
        </h2>
        <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'friends' as const, label: `Do'stlar (${friends.length})`, icon: Users },
          { key: 'challenges' as const, label: 'Challenge', icon: Swords },
          { key: 'requests' as const, label: `So'rovlar (${pendingRequests.length})`, icon: UserPlus },
          { key: 'search' as const, label: 'Qidirish', icon: Search },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 min-w-[80px] ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'challenges' ? (
        <ChallengesTab />
      ) : loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /></div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Friends List */}
          {tab === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {friends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Hali do'stlaringiz yo'q</p>
                  <p className="text-sm mt-1">"Qidirish" tabidan foydalanuvchilarni toping!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map(f => {
                    const fid = f.user_id === user?.id ? f.friend_id : f.user_id;
                    return (
                      <div key={f.id} className="card-elevated p-3 flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={f.avatar_url || ''} />
                          <AvatarFallback>{(f.full_name || '?')[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{f.full_name || 'Foydalanuvchi'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Trophy className="w-3 h-3" /> {f.xp} XP
                            <span>•</span>
                            Level {f.level}
                          </div>
                        </div>
                        <FollowButton targetUserId={fid} targetName={f.full_name} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs shrink-0"
                          onClick={() => setChallengeTarget({ id: fid, name: f.full_name || 'Foydalanuvchi' })}
                        >
                          <Swords className="w-3.5 h-3.5 mr-1" /> Challenge
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => removeFriend(f.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Pending Requests */}
          {tab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hozircha so'rovlar yo'q</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map(r => (
                    <div key={r.id} className="card-elevated p-3 flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={r.avatar_url || ''} />
                        <AvatarFallback>{(r.full_name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.full_name || 'Foydalanuvchi'}</p>
                        <p className="text-xs text-muted-foreground">Do'stlik so'rovi</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => acceptRequest(r.id, r.user_id)} className="h-8">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectRequest(r.id)} className="h-8">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Search */}
          {tab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <form onSubmit={(e) => { e.preventDefault(); searchUsers(); }} className="flex gap-2 mb-4">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ism yoki username kiriting..."
                  className="flex-1"
                />
                <Button type="submit" disabled={searching || !searchQuery.trim()}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </form>

              <div className="space-y-2">
                {searchResults.map(r => (
                  <div key={r.user_id} className="card-elevated p-3 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={r.avatar_url || ''} />
                      <AvatarFallback>{(r.full_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.full_name || 'Foydalanuvchi'}</p>
                      {r.username && <p className="text-xs text-muted-foreground">@{r.username}</p>}
                    </div>
                    <FollowButton targetUserId={r.user_id} targetName={r.full_name} />
                    <Button size="sm" variant="outline" onClick={() => sendRequest(r.user_id)}>
                      <UserPlus className="w-4 h-4 mr-1" /> Qo'shish
                    </Button>
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-center text-muted-foreground text-sm py-8">Natija topilmadi</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {challengeTarget && (
        <ChallengeCreateModal
          friendId={challengeTarget.id}
          friendName={challengeTarget.name}
          onClose={() => setChallengeTarget(null)}
          onCreated={() => setTab('challenges')}
        />
      )}
    </motion.div>
  );
};
