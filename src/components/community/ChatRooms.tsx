import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Hash, X, Forward, Search, User, Plus, Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ChatMediaInput } from './ChatMediaInput';
import { ChatMessageBubble, ReplyInfo, ForwardInfo } from './ChatMessageBubble';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Room { id: string; name: string; description: string | null; level: string; }
interface Message { id: string; room_id: string; user_id: string; content: string; created_at: string; image_url?: string | null; audio_url?: string | null; reply_to_id?: string | null; forwarded_from?: string | null; }
interface Profile { user_id: string; full_name: string | null; username: string | null; avatar_url: string | null; }

export const ChatRooms = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<ReplyInfo | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ForwardInfo | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('chat_rooms').select('*').then(({ data }) => { if (data) setRooms(data); });
    if (user) {
      (supabase.from('profiles') as any).select('user_id, full_name, username, avatar_url').neq('user_id', user.id).limit(50)
        .then(({ data }: any) => { if (data) setAllUsers(data); });
    }
  }, [user]);

  useEffect(() => {
    if (!activeRoom) return;
    supabase.from('chat_messages').select('*').eq('room_id', activeRoom.id).order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => {
        if (data) { setMessages(data as Message[]); loadProfiles(data.map(m => m.user_id)); }
      });

    const channel = supabase.channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new as Message;
            setMessages(prev => [...prev, msg]);
            loadProfiles([msg.user_id]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            if (old?.id) setMessages(prev => prev.filter(m => m.id !== old.id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadProfiles = async (userIds: string[]) => {
    const newIds = userIds.filter(id => !profiles[id]);
    if (newIds.length === 0) return;
    const { data } = await supabase.from('profiles').select('user_id, full_name').in('user_id', newIds);
    if (data) {
      setProfiles(prev => {
        const updated = { ...prev };
        data.forEach(p => { updated[p.user_id] = p.full_name || 'Foydalanuvchi'; });
        return updated;
      });
    }
  };

  const handleSend = async (data: { content: string; image_url?: string; audio_url?: string; reply_to_id?: string }) => {
    if (!activeRoom || !user) return;
    await supabase.from('chat_messages').insert({
      room_id: activeRoom.id, user_id: user.id, content: data.content,
      ...(data.image_url && { image_url: data.image_url }),
      ...(data.audio_url && { audio_url: data.audio_url }),
      ...(data.reply_to_id && { reply_to_id: data.reply_to_id }),
    } as any);
    setReplyTo(null);
  };

  const handleForwardToDM = async (targetProfile: Profile) => {
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
    await supabase.from('chat_messages').update({ content: newContent } as any).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success("Xabar o'chirildi");
  };

  const forwardFilteredUsers = forwardSearch.trim() ? allUsers.filter(u => {
    const q = forwardSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  }) : allUsers.slice(0, 10);

  // Forward modal
  if (forwardMsg) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setForwardMsg(null); setForwardSearch(''); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
          <Forward className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Xabarni DM ga yo'naltirish</span>
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
            <button key={u.user_id} onClick={() => handleForwardToDM(u)}
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

  if (!activeRoom) {
    return (
      <div className="space-y-3">
        {rooms.map(room => (
          <motion.button key={room.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => setActiveRoom(room)}
            className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-left transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
            <div>
              <h3 className="font-semibold">{room.name}</h3>
              <p className="text-sm text-muted-foreground">{room.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
        <button onClick={() => setActiveRoom(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <Hash className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">{activeRoom.name}</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => {
            const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
            const replyInfo = replyMsg ? {
              id: replyMsg.id,
              content: replyMsg.image_url ? '📷 Rasm' : replyMsg.audio_url ? '🎤 Ovozli xabar' : replyMsg.content,
              senderName: replyMsg.user_id === user?.id ? 'Siz' : (profiles[replyMsg.user_id] || 'Foydalanuvchi'),
            } : null;
            return (
              <ChatMessageBubble key={msg.id} id={msg.id} isMe={msg.user_id === user?.id} content={msg.content}
                image_url={msg.image_url} audio_url={msg.audio_url} created_at={msg.created_at}
                senderName={msg.user_id !== user?.id ? profiles[msg.user_id] : undefined}
                replyTo={replyInfo} forwardedFrom={msg.forwarded_from} messageType="room"
                onEdit={msg.user_id === user?.id ? handleEdit : undefined}
                onDelete={msg.user_id === user?.id ? handleDelete : undefined}
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
