import { useState, useRef } from 'react';
import { Pencil, Trash2, X, Check, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatMessageBubbleProps {
  id?: string;
  isMe: boolean;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  created_at: string;
  senderName?: string;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
}

export const ChatMessageBubble = ({ id, isMe, content, image_url, audio_url, created_at, senderName, onEdit, onDelete }: ChatMessageBubbleProps) => {
  const [imgOpen, setImgOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  
  const hasImage = !!image_url;
  const hasAudio = !!audio_url;
  const isMediaPlaceholder = content === '🎤 Ovozli xabar' || content === '📷 Rasm';
  const showText = content && (!isMediaPlaceholder || (!hasImage && !hasAudio));

  const handleEdit = () => {
    if (id && onEdit && editText.trim()) {
      onEdit(id, editText.trim());
      setIsEditing(false);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (id && onDelete) {
      onDelete(id);
    }
    setShowMenu(false);
  };

  return (
    <>
      <div className={`group flex ${isMe ? 'justify-end' : ''}`}>
        <div className="relative">
          {/* Action menu trigger */}
          {isMe && id && (onEdit || onDelete) && !isEditing && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute z-50 right-0 -top-2 -translate-y-full bg-popover border border-border rounded-xl shadow-lg p-1 min-w-[140px]">
                {onEdit && !hasAudio && !hasImage && (
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Tahrirlash
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> O'chirish
                  </button>
                )}
              </div>
            </>
          )}

          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
            {senderName && !isMe && <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>}
            
            {hasImage && (
              <img
                src={image_url!}
                alt="Rasm"
                className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1.5"
                onClick={() => setImgOpen(true)}
              />
            )}

            {hasAudio && (
              <div className="mb-1.5">
                <audio 
                  controls 
                  className="max-w-full" 
                  preload="metadata"
                  style={{ filter: isMe ? 'invert(1) brightness(2)' : 'none' }}
                >
                  <source src={audio_url!} type="audio/webm" />
                  <source src={audio_url!} type="audio/ogg" />
                </audio>
              </div>
            )}

            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="h-7 text-sm bg-background text-foreground rounded-lg"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                />
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
