import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMediaInput } from './ChatMediaInput';
import { ChatMessageBubble } from './ChatMessageBubble';

interface Room { id: string; name: string; description: string | null; level: string; }
interface Message { id: string; room_id: string; user_id: string; content: string; created_at: string; image_url?: string | null; audio_url?: string | null; }

export const ChatRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('chat_rooms').select('*').then(({ data }) => { if (data) setRooms(data); });
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    supabase.from('chat_messages').select('*').eq('room_id', activeRoom.id).order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => {
        if (data) {
          setMessages(data as Message[]);
          loadProfiles(data.map(m => m.user_id));
        }
      });

    const channel = supabase.channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => [...prev, msg]);
          loadProfiles([msg.user_id]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = async (data: { content: string; image_url?: string; audio_url?: string }) => {
    if (!activeRoom || !user) return;
    await supabase.from('chat_messages').insert({
      room_id: activeRoom.id,
      user_id: user.id,
      content: data.content,
      ...(data.image_url && { image_url: data.image_url }),
      ...(data.audio_url && { audio_url: data.audio_url }),
    } as any);
  };

  if (!activeRoom) {
    return (
      <div className="space-y-3">
        {rooms.map(room => (
          <motion.button key={room.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => setActiveRoom(room)}
            className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-left transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
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
        <button onClick={() => setActiveRoom(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Hash className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">{activeRoom.name}</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => (
            <ChatMessageBubble
              key={msg.id}
              isMe={msg.user_id === user?.id}
              content={msg.content}
              image_url={msg.image_url}
              audio_url={msg.audio_url}
              created_at={msg.created_at}
              senderName={msg.user_id !== user?.id ? profiles[msg.user_id] : undefined}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <ChatMediaInput onSend={handleSend} />
    </div>
  );
};
