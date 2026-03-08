import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image, Mic, Square, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMediaInputProps {
  onSend: (data: { content: string; image_url?: string; audio_url?: string }) => Promise<void>;
}

export const ChatMediaInput = ({ onSend }: ChatMediaInputProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: Blob, ext: string, folder: string): Promise<string | null> => {
    if (!user) return null;
    const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(fileName, file);
    if (error) { toast.error("Fayl yuklanmadi"); return null; }
    const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Rasm 5MB dan kichik bo'lishi kerak"); return; }
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return;
        setIsSending(true);
        const url = await uploadFile(blob, 'webm', 'voice');
        if (url) await onSend({ content: '🎤 Ovozli xabar', audio_url: url });
        setIsSending(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error("Mikrofonga ruxsat berilmadi");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;
    setIsSending(true);
    let image_url: string | undefined;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const url = await uploadFile(imageFile, ext, 'images');
      if (url) image_url = url;
    }
    await onSend({ content: input.trim() || (image_url ? '📷 Rasm' : ''), image_url });
    setInput('');
    setImageFile(null);
    setPreviewImage(null);
    setIsSending(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isRecording) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">Yozib olinmoqda... {formatTime(recordingTime)}</span>
          </div>
          <Button onClick={stopRecording} size="icon" variant="destructive" className="rounded-xl shrink-0">
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      {previewImage && (
        <div className="px-4 pt-3 flex items-start gap-2">
          <div className="relative">
            <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-border" />
            <button onClick={() => { setPreviewImage(null); setImageFile(null); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      <div className="px-4 py-3">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="rounded-xl shrink-0" disabled={isSending}>
            <Image className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={startRecording} className="rounded-xl shrink-0" disabled={isSending}>
            <Mic className="w-4 h-4" />
          </Button>
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Xabar yozing..." className="rounded-xl" disabled={isSending} />
          <Button type="submit" size="icon" disabled={(!input.trim() && !imageFile) || isSending} className="rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
