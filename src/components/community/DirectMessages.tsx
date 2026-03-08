import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCall } from '@/contexts/CallContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Search, User, Phone, Video, X, Forward } from 'lucide-react';
import { ChatMediaInput } from './ChatMediaInput';
import { ChatMessageBubble, ReplyInfo, ForwardInfo } from './ChatMessageBubble';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Profile { user_id: string; full_name: string | null; username: string | null; avatar_url: string | null; }
interface DM { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string; image_url?: string | null; audio_url?: string | null; reply_to_id?: string | null; forwarded_from?: string | null; }
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
  const [replyTo, setReplyTo] = useState<ReplyInfo | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ForwardInfo | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChatPreviews = useCallback(async () => {
    if (!user) return;
    const { data: dms } = await supabase.from('direct_messages').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (!dms || dms.length === 0) { setChatPreviews([]); return; }

    const contactMap = new Map<string, { lastMsg: DM; unread: number }>();
    for (const dm of dms as DM[]) {
      const contactId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
      if (!contactMap.has(contactId)) contactMap.set(contactId, { lastMsg: dm, unread: 0 });
      if (dm.receiver_id === user.id && !dm.is_read) contactMap.get(contactId)!.unread++;
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
    const channel = supabase.channel('dm-previews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => loadChatPreviews())
      .subscribe();
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
              if (msg.sender_id === otherId) supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === (payload.new as DM).id ? payload.new as DM : m));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            if (old?.id) setMessages(prev => prev.filter(m => m.id !== old.id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeContact, user]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (data: { content: string; image_url?: string; audio_url?: string; reply_to_id?: string }) => {
    if (!activeContact || !user) return;
    await supabase.from('direct_messages').insert({
      sender_id: user.id, receiver_id: activeContact.user_id, content: data.content,
      ...(data.image_url && { image_url: data.image_url }),
      ...(data.audio_url && { audio_url: data.audio_url }),
      ...(data.reply_to_id && { reply_to_id: data.reply_to_id }),
    } as any);
    setReplyTo(null);
  };

  const handleForwardTo = async (targetProfile: Profile) => {
    if (!forwardMsg || !user) return;
    await supabase.from('direct_messages').insert({
      sender_id: user.id, receiver_id: targetProfile.user_id,
      content: forwardMsg.content,
      ...(forwardMsg.image_url && { image_url: forwardMsg.image_url }),
      ...(forwardMsg.audio_url && { audio_url: forwardMsg.audio_url }),
      forwarded_from: forwardMsg.originalSender,
    } as any);
    setForwardMsg(null);
    setForwardSearch('');
    toast.success(`Xabar ${targetProfile.username ? `@${targetProfile.username}` : targetProfile.full_name}ga yo'naltirildi`);
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

  const filteredUsers = search.trim() ? allUsers.filter(u => {
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  }) : [];

  const forwardFilteredUsers = forwardSearch.trim() ? allUsers.filter(u => {
    const q = forwardSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  }) : allUsers.slice(0, 10);

  // Forward modal
  if (forwardMsg) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setForwardMsg(null); setForwardSearch(''); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
          <Forward className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Xabarni yo'naltirish</span>
        </div>
        <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm">
          <p className="text-xs text-muted-foreground mb-1">Yo'naltiriladigan xabar:</p>
          <p className="truncate">{forwardMsg.content}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={forwardSearch} onChange={e => setForwardSearch(e.target.value)} placeholder="Kimga yo'naltirish..." className="pl-10 rounded-xl" />
        </div>
        <div className="space-y-0.5 max-h-80 overflow-y-auto">
          {forwardFilteredUsers.map(u => (
            <button key={u.user_id} onClick={() => handleForwardTo(u)}
              className="w-full p-3 rounded-xl hover:bg-muted flex items-center gap-3 text-left transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
              </div>
              <span className="font-medium text-sm">{u.username ? `@${u.username}` : u.full_name || 'Foydalanuvchi'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

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
              <button key={u.user_id} onClick={() => { setActiveContact(u); setSearch(''); }}
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
            {chatPreviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Hali suhbatlar yo'q. Yuqoridan foydalanuvchi qidiring!</p>}
            <div className="space-y-0.5">
              {chatPreviews.map(chat => (
                <button key={chat.profile.user_id} onClick={() => setActiveContact(chat.profile)}
                  className="w-full px-3 py-3 rounded-xl hover:bg-muted/50 flex items-center gap-3 text-left transition-colors">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {chat.profile.avatar_url ? <img src={chat.profile.avatar_url} className="w-11 h-11 rounded-full object-cover" /> : <User className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{chat.profile.username ? `@${chat.profile.username}` : chat.profile.full_name || 'Foydalanuvchi'}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(chat.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">{chat.unreadCount}</span>
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
        <button onClick={() => setActiveContact(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
        <span className="font-semibold text-sm flex-1">{activeContact.username ? `@${activeContact.username}` : activeContact.full_name || 'Foydalanuvchi'}</span>
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => call.startCall(activeContact.user_id, 'audio')} disabled={call.callState !== 'idle'}><Phone className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => call.startCall(activeContact.user_id, 'video')} disabled={call.callState !== 'idle'}><Video className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => {
            const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
            const replyInfo = replyMsg ? {
              id: replyMsg.id,
              content: replyMsg.image_url ? '📷 Rasm' : replyMsg.audio_url ? '🎤 Ovozli xabar' : replyMsg.content,
              senderName: replyMsg.sender_id === user?.id ? 'Siz' : (activeContact?.username ? `@${activeContact.username}` : activeContact?.full_name || 'Foydalanuvchi'),
            } : null;
            return (
              <ChatMessageBubble key={msg.id} id={msg.id} isMe={msg.sender_id === user?.id} content={msg.content}
                image_url={msg.image_url} audio_url={msg.audio_url} created_at={msg.created_at}
                replyTo={replyInfo} forwardedFrom={msg.forwarded_from} messageType="dm"
                onEdit={msg.sender_id === user?.id ? handleEdit : undefined}
                onDelete={msg.sender_id === user?.id ? handleDelete : undefined}
                onReply={(info) => setReplyTo(info)}
                onForward={(info) => setForwardMsg(info)}
              />
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <ChatMediaInput onSend={handleSend} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </div>
  );
};
