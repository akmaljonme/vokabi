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

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : ''}`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
          {senderName && !isMe && <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>}
          
          {image_url && (
            <img
              src={image_url}
              alt="Rasm"
              className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1.5"
              onClick={() => setImgOpen(true)}
            />
          )}

          {audio_url && (
            <audio controls className="max-w-full mb-1.5" preload="metadata">
              <source src={audio_url} type="audio/webm" />
            </audio>
          )}

          {content && !content.startsWith('🎤') && !content.startsWith('📷') && (
            <p>{content}</p>
          )}
          {content && (content.startsWith('🎤') || content.startsWith('📷')) && !image_url && !audio_url && (
            <p>{content}</p>
          )}
          
          <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {new Date(created_at).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {imgOpen && image_url && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setImgOpen(false)}>
          <img src={image_url} alt="Rasm" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </>
  );
};
