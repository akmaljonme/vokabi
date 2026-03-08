import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCall } from '@/contexts/CallContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Search, User, Phone, Video } from 'lucide-react';
import { ChatMediaInput } from './ChatMediaInput';
import { ChatMessageBubble } from './ChatMessageBubble';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Profile { user_id: string; full_name: string | null; username: string | null; avatar_url: string | null; }
interface DM { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string; image_url?: string | null; audio_url?: string | null; }
interface ChatPreview { profile: Profile; lastMessage: string; lastMessageAt: string; unreadCount: number; }

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return d.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Kecha';
  if (days < 7) return d.toLocaleDateString('uz', { weekday: 'short' });
  return d.toLocaleDateString('uz', { day: '2-digit', month: '2-digit' });
};

export const DirectMessages = () => {
  const { user } = useAuth();
  const call = useCall();
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [activeContact, setActiveContact] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChatPreviews = useCallback(async () => {
    if (!user) return;
    // Get all DMs for user
    const { data: dms } = await supabase.from('direct_messages').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (!dms || dms.length === 0) { setChatPreviews([]); return; }

    // Group by contact
    const contactMap = new Map<string, { lastMsg: DM; unread: number }>();
    for (const dm of dms as DM[]) {
      const contactId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, { lastMsg: dm, unread: 0 });
      }
      if (dm.receiver_id === user.id && !dm.is_read) {
        const entry = contactMap.get(contactId)!;
        entry.unread++;
      }
    }

    const ids = [...contactMap.keys()];
    if (ids.length === 0) { setChatPreviews([]); return; }
    const { data: profiles } = await (supabase.from('profiles') as any).select('user_id, full_name, username, avatar_url').in('user_id', ids);
    if (!profiles) return;

    const profileMap = new Map<string, Profile>();
    for (const p of profiles) profileMap.set(p.user_id, p);

    const previews: ChatPreview[] = [];
    for (const [contactId, { lastMsg, unread }] of contactMap) {
      const profile = profileMap.get(contactId);
      if (!profile) continue;
      let preview = lastMsg.content;
      if (lastMsg.image_url) preview = '📷 Rasm';
      if (lastMsg.audio_url) preview = '🎤 Ovozli xabar';
      if (preview.length > 40) preview = preview.slice(0, 40) + '...';
      if (lastMsg.sender_id === user.id) preview = `Siz: ${preview}`;
      previews.push({ profile, lastMessage: preview, lastMessageAt: lastMsg.created_at, unreadCount: unread });
    }
    previews.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    setChatPreviews(previews);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadChatPreviews();
    loadAllUsers();

    // Listen for new DMs to refresh previews
    const channel = supabase.channel('dm-previews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        loadChatPreviews();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadChatPreviews]);

  const loadAllUsers = async () => {
    if (!user) return;
    const { data } = await (supabase.from('profiles') as any).select('user_id, full_name, username, avatar_url').neq('user_id', user.id).limit(50);
    if (data) setAllUsers(data);
  };

  useEffect(() => {
    if (!activeContact || !user) return;
    const otherId = activeContact.user_id;

    supabase.from('direct_messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { if (data) setMessages(data as DM[]); });

    supabase.from('direct_messages').update({ is_read: true }).eq('sender_id', otherId).eq('receiver_id', user.id).eq('is_read', false).then(() => {});

    const channel = supabase.channel(`dm-${[user.id, otherId].sort().join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new as DM;
            if ((msg.sender_id === user.id && msg.receiver_id === otherId) || (msg.sender_id === otherId && msg.receiver_id === user.id)) {
              setMessages(prev => [...prev, msg]);
              if (msg.sender_id === otherId) {
                supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const msg = payload.new as DM;
            setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            if (old?.id) setMessages(prev => prev.filter(m => m.id !== old.id));
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeContact, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (data: { content: string; image_url?: string; audio_url?: string }) => {
    if (!activeContact || !user) return;
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: activeContact.user_id,
      content: data.content,
      ...(data.image_url && { image_url: data.image_url }),
      ...(data.audio_url && { audio_url: data.audio_url }),
    } as any);
  };

  const handleEdit = async (id: string, newContent: string) => {
    await supabase.from('direct_messages').update({ content: newContent } as any).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('direct_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success("Xabar o'chirildi");
  };

  const startChat = (profile: Profile) => {
    setActiveContact(profile);
  };

  const filteredUsers = search.trim() ? allUsers.filter(u => {
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  }) : [];

  if (!activeContact) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Foydalanuvchi qidirish..." className="pl-10 rounded-xl" />
        </div>
        {search.trim() && (
          <div className="space-y-0.5">
            {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Topilmadi</p>}
            {filteredUsers.map(u => (
              <button key={u.user_id} onClick={() => { startChat(u); setSearch(''); }}
                className="w-full p-3 rounded-xl hover:bg-muted flex items-center gap-3 text-left transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <User className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-sm">{u.username ? `@${u.username}` : u.full_name || 'Foydalanuvchi'}</span>
                  {u.username && u.full_name && <p className="text-xs text-muted-foreground">{u.full_name}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
        {!search.trim() && (
          <>
            {chatPreviews.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Hali suhbatlar yo'q. Yuqoridan foydalanuvchi qidiring!</p>
            )}
            <div className="space-y-0.5">
              {chatPreviews.map(chat => (
                <button key={chat.profile.user_id} onClick={() => setActiveContact(chat.profile)}
                  className="w-full px-3 py-3 rounded-xl hover:bg-muted/50 flex items-center gap-3 text-left transition-colors">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
                    {chat.profile.avatar_url
                      ? <img src={chat.profile.avatar_url} className="w-11 h-11 rounded-full object-cover" />
                      : <User className="w-5 h-5 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">
                        {chat.profile.username ? `@${chat.profile.username}` : chat.profile.full_name || 'Foydalanuvchi'}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(chat.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
        <button onClick={() => setActiveContact(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-sm flex-1">{activeContact.username ? `@${activeContact.username}` : activeContact.full_name || 'Foydalanuvchi'}</span>
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => call.startCall(activeContact.user_id, 'audio')} disabled={call.callState !== 'idle'}>
          <Phone className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => call.startCall(activeContact.user_id, 'video')} disabled={call.callState !== 'idle'}>
          <Video className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => (
            <ChatMessageBubble
              key={msg.id}
              id={msg.id}
              isMe={msg.sender_id === user?.id}
              content={msg.content}
              image_url={msg.image_url}
              audio_url={msg.audio_url}
              created_at={msg.created_at}
              onEdit={msg.sender_id === user?.id ? handleEdit : undefined}
              onDelete={msg.sender_id === user?.id ? handleDelete : undefined}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <ChatMediaInput onSend={handleSend} />
    </div>
  );
};
