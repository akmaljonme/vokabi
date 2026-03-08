import { useState } from 'react';

interface ChatMessageBubbleProps {
  isMe: boolean;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  created_at: string;
  senderName?: string;
}

export const ChatMessageBubble = ({ isMe, content, image_url, audio_url, created_at, senderName }: ChatMessageBubbleProps) => {
  const [imgOpen, setImgOpen] = useState(false);
  
  const hasImage = !!image_url;
  const hasAudio = !!audio_url;
  const isMediaPlaceholder = content === '🎤 Ovozli xabar' || content === '📷 Rasm';
  const showText = content && (!isMediaPlaceholder || (!hasImage && !hasAudio));

  console.log('[ChatBubble]', { content, image_url, audio_url, hasImage, hasAudio });

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : ''}`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
          {senderName && !isMe && <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>}
          
          {hasImage && (
            <img
              src={image_url!}
              alt="Rasm"
              className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1.5"
              onClick={() => setImgOpen(true)}
              onError={(e) => { console.error('[ChatBubble] Image load error:', image_url); }}
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
                Brauzeringiz audio formatini qo'llab-quvvatlamaydi.
              </audio>
            </div>
          )}

          {showText && <p>{content}</p>}
          
          <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {new Date(created_at).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
          </p>
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
