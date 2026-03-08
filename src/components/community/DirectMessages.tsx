import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Search, User } from 'lucide-react';

interface Profile { user_id: string; full_name: string | null; username: string | null; avatar_url: string | null; }
interface DM { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string; }

export const DirectMessages = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeContact, setActiveContact] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load contacts from DM history
  useEffect(() => {
    if (!user) return;
    loadContacts();
    loadAllUsers();
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    const { data: dms } = await supabase.from('direct_messages').select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
    
    if (!dms) return;
    const ids = [...new Set(dms.flatMap(d => [d.sender_id, d.receiver_id]).filter(id => id !== user.id))];
    if (ids.length === 0) return;
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, username, avatar_url').in('user_id', ids);
    if (profiles) setContacts(profiles);
  };

  const loadAllUsers = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('user_id, full_name, username, avatar_url').neq('user_id', user.id).limit(50);
    if (data) setAllUsers(data);
  };

  useEffect(() => {
    if (!activeContact || !user) return;
    const otherId = activeContact.user_id;

    supabase.from('direct_messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { if (data) setMessages(data); });

    // Mark as read
    supabase.from('direct_messages').update({ is_read: true }).eq('sender_id', otherId).eq('receiver_id', user.id).eq('is_read', false).then(() => {});

    // Realtime
    const channel = supabase.channel(`dm-${[user.id, otherId].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new as DM;
          if ((msg.sender_id === user.id && msg.receiver_id === otherId) || (msg.sender_id === otherId && msg.receiver_id === user.id)) {
            setMessages(prev => [...prev, msg]);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeContact, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeContact || !user) return;
    const content = input.trim();
    setInput('');
    await supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: activeContact.user_id, content });
  };

  const startChat = (profile: Profile) => {
    setActiveContact(profile);
    if (!contacts.find(c => c.user_id === profile.user_id)) {
      setContacts(prev => [profile, ...prev]);
    }
  };

  const filteredUsers = search.trim() ? allUsers.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase())) : [];

  if (!activeContact) {
    return (
      <div className="space-y-4">
        {/* Search users */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Foydalanuvchi qidirish..." className="pl-10 rounded-xl" />
        </div>

        {search.trim() && (
          <div className="space-y-1">
            {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Topilmadi</p>}
            {filteredUsers.map(u => (
              <button key={u.user_id} onClick={() => { startChat(u); setSearch(''); }}
                className="w-full p-3 rounded-xl hover:bg-muted flex items-center gap-3 text-left transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm">{u.full_name || 'Foydalanuvchi'}</span>
              </button>
            ))}
          </div>
        )}

        {!search.trim() && (
          <>
            <p className="text-sm text-muted-foreground">{contacts.length ? 'So\'nggi suhbatlar' : 'Hali suhbatlar yo\'q. Yuqoridan foydalanuvchi qidiring!'}</p>
            {contacts.map(c => (
              <button key={c.user_id} onClick={() => setActiveContact(c)}
                className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 flex items-center gap-4 text-left transition-all">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold">{c.full_name || 'Foydalanuvchi'}</span>
              </button>
            ))}
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
        <span className="font-semibold text-sm">{activeContact.full_name || 'Foydalanuvchi'}</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : ''}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Xabar yozing..." className="rounded-xl" />
          <Button type="submit" size="icon" disabled={!input.trim()} className="rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
