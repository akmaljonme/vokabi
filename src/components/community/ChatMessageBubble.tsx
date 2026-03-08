import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, X, Check, Reply, Forward, Smile } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export interface ReplyInfo {
  id: string;
  content: string;
  senderName?: string;
}

export interface ForwardInfo {
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  originalSender: string;
}

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

interface ChatMessageBubbleProps {
  id?: string;
  isMe: boolean;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  created_at: string;
  senderName?: string;
  replyTo?: ReplyInfo | null;
  forwardedFrom?: string | null;
  messageType?: 'dm' | 'room';
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (msg: ReplyInfo) => void;
  onForward?: (msg: ForwardInfo) => void;
}

export const ChatMessageBubble = ({
  id, isMe, content, image_url, audio_url, created_at, senderName,
  replyTo, forwardedFrom, messageType = 'dm',
  onEdit, onDelete, onReply, onForward
}: ChatMessageBubbleProps) => {
  const { user } = useAuth();
  const [imgOpen, setImgOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [longPressMenu, setLongPressMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const hasImage = !!image_url;
  const hasAudio = !!audio_url;
  const isMediaPlaceholder = content === '🎤 Ovozli xabar' || content === '📷 Rasm';
  const showText = content && (!isMediaPlaceholder || (!hasImage && !hasAudio));

  // Load reactions
  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const { data } = await (supabase.from('message_reactions') as any)
        .select('emoji, user_id')
        .eq('message_id', id);
      if (!data) return;
      const map = new Map<string, { count: number; hasReacted: boolean }>();
      for (const r of data) {
        const existing = map.get(r.emoji) || { count: 0, hasReacted: false };
        existing.count++;
        if (r.user_id === user.id) existing.hasReacted = true;
        map.set(r.emoji, existing);
      }
      setReactions([...map.entries()].map(([emoji, v]) => ({ emoji, ...v })));
    };
    load();

    const channel = supabase.channel(`reactions-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions', filter: `message_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  const toggleReaction = async (emoji: string) => {
    if (!id || !user) return;
    const existing = reactions.find(r => r.emoji === emoji && r.hasReacted);
    if (existing) {
      await (supabase.from('message_reactions') as any).delete().eq('message_id', id).eq('user_id', user.id).eq('emoji', emoji);
    } else {
      await (supabase.from('message_reactions') as any).insert({ message_id: id, user_id: user.id, emoji, message_type: messageType });
    }
    setShowEmojis(false);
    setLongPressMenu(false);
  };

  const handleEdit = () => {
    if (id && onEdit && editText.trim()) { onEdit(id, editText.trim()); setIsEditing(false); }
    setLongPressMenu(false);
  };

  const handleDelete = () => { if (id && onDelete) onDelete(id); setLongPressMenu(false); };

  const handleReply = () => {
    if (id && onReply) onReply({ id, content: hasImage ? '📷 Rasm' : hasAudio ? '🎤 Ovozli xabar' : content, senderName: isMe ? 'Siz' : senderName });
    setLongPressMenu(false);
  };

  const handleForward = () => {
    if (onForward) onForward({ content, image_url, audio_url, originalSender: isMe ? 'Siz' : (senderName || 'Foydalanuvchi') });
    setLongPressMenu(false);
  };

  // Long press / double tap for context menu (Telegram-style)
  const onPointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      setLongPressMenu(true);
    }, 500);
  };

  const onPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Double click for quick ❤️ reaction (Instagram-style)
  const lastTap = useRef(0);
  const onDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleReaction('❤️');
    }
    lastTap.current = now;
  };

  return (
    <>
      <div className={`group flex ${isMe ? 'justify-end' : ''}`}>
        <div className="relative max-w-[80%]">

          {/* Quick emoji bar on hover (desktop) - Telegram style */}
          <AnimatePresence>
            {!longPressMenu && !isEditing && id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-1 -translate-y-full hidden group-hover:flex items-center gap-0.5 bg-popover border border-border rounded-full shadow-lg px-1.5 py-1 z-30`}
              >
                {['❤️', '👍', '😂', '🔥'].map(emoji => (
                  <button key={emoji} onClick={() => toggleReaction(emoji)}
                    className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-sm transition-all hover:scale-125">
                    {emoji}
                  </button>
                ))}
                <button onClick={() => setShowEmojis(true)}
                  className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                  <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {onReply && (
                  <button onClick={handleReply}
                    className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                    <Reply className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full emoji picker */}
          <AnimatePresence>
            {showEmojis && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmojis(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute z-50 ${isMe ? 'right-0' : 'left-0'} -top-2 -translate-y-full bg-popover border border-border rounded-2xl shadow-xl p-2.5 flex gap-1.5`}
                >
                  {EMOJI_OPTIONS.map(emoji => (
                    <motion.button key={emoji} onClick={() => toggleReaction(emoji)}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center text-xl transition-colors">
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Long press context menu (Telegram-style) */}
          <AnimatePresence>
            {longPressMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                  onClick={() => setLongPressMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className={`absolute z-50 ${isMe ? 'right-0' : 'left-0'} -top-3 -translate-y-full space-y-2`}
                >
                  {/* Quick emoji row */}
                  <div className="bg-popover border border-border rounded-2xl shadow-xl p-2 flex gap-1">
                    {EMOJI_OPTIONS.map(emoji => (
                      <motion.button key={emoji} onClick={() => toggleReaction(emoji)}
                        whileHover={{ scale: 1.25 }}
                        whileTap={{ scale: 0.85 }}
                        className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-lg transition-colors">
                        {emoji}
                      </motion.button>
                    ))}
                  </div>

                  {/* Action menu */}
                  <div className="bg-popover border border-border rounded-2xl shadow-xl p-1.5 min-w-[180px]">
                    {onReply && (
                      <button onClick={handleReply}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors">
                        <Reply className="w-4 h-4 text-muted-foreground" />
                        <span>Javob berish</span>
                      </button>
                    )}
                    {onForward && (
                      <button onClick={handleForward}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors">
                        <Forward className="w-4 h-4 text-muted-foreground" />
                        <span>Yo'naltirish</span>
                      </button>
                    )}
                    {isMe && onEdit && !hasAudio && !hasImage && (
                      <button onClick={() => { setIsEditing(true); setLongPressMenu(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                        <span>Tahrirlash</span>
                      </button>
                    )}
                    {isMe && onDelete && (
                      <>
                        <div className="h-px bg-border mx-2 my-1" />
                        <button onClick={handleDelete}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                          <span>O'chirish</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Message bubble */}
          <div
            ref={bubbleRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={onDoubleTap}
            className={`rounded-2xl px-4 py-2.5 text-sm select-none ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'} ${longPressMenu ? 'ring-2 ring-primary/30 scale-[1.02]' : ''} transition-transform`}
          >
            {senderName && !isMe && <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>}

            {/* Forwarded label */}
            {forwardedFrom && (
              <div className={`flex items-center gap-1 mb-1.5 text-[11px] ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                <Forward className="w-3 h-3" />
                <span>Yo'naltirilgan: {forwardedFrom}</span>
              </div>
            )}

            {replyTo && (
              <div className={`mb-2 pl-2.5 border-l-2 rounded-r-lg px-2 py-1.5 text-xs ${isMe ? 'border-primary-foreground/40 bg-primary-foreground/10' : 'border-primary/40 bg-primary/5'}`}>
                <p className={`font-semibold mb-0.5 ${isMe ? 'text-primary-foreground/80' : 'text-primary'}`}>{replyTo.senderName || 'Foydalanuvchi'}</p>
                <p className={`truncate ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{replyTo.content}</p>
              </div>
            )}

            {hasImage && <img src={image_url!} alt="Rasm" className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1.5" onClick={() => setImgOpen(true)} />}

            {hasAudio && (
              <div className="mb-1.5">
                <audio controls className="max-w-full" preload="metadata" style={{ filter: isMe ? 'invert(1) brightness(2)' : 'none' }}>
                  <source src={audio_url!} type="audio/webm" />
                  <source src={audio_url!} type="audio/ogg" />
                </audio>
              </div>
            )}

            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <Input value={editText} onChange={e => setEditText(e.target.value)} className="h-7 text-sm bg-background text-foreground rounded-lg" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setIsEditing(false); }} />
                <button onClick={handleEdit} className="p-1 rounded hover:bg-primary-foreground/20"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsEditing(false)} className="p-1 rounded hover:bg-primary-foreground/20"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              showText && <p>{content}</p>
            )}

            <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
              {new Date(created_at).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Reactions display - Telegram style pills */}
          {reactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}
            >
              {reactions.map(r => (
                <motion.button
                  key={r.emoji}
                  onClick={() => toggleReaction(r.emoji)}
                  whileTap={{ scale: 0.85 }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                    r.hasReacted
                      ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                      : 'bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/20'
                  }`}
                >
                  <motion.span
                    key={`${r.emoji}-${r.count}`}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="text-sm"
                  >
                    {r.emoji}
                  </motion.span>
                  <span className="text-[11px] font-semibold tabular-nums">{r.count}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {imgOpen && image_url && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setImgOpen(false)}>
          <img src={image_url} alt="Rasm" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </>
  );
};
