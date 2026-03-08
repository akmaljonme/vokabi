import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AudioCallDialogProps {
  contactName: string;
  contactId: string;
  onClose: () => void;
}

export const AudioCallDialog = ({ contactName, contactId, onClose }: AudioCallDialogProps) => {
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCall();
    return () => endCall();
  }, []);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Simulate connection (WebRTC peer connection would go here in production)
      setTimeout(() => {
        setCallState('connected');
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.info(`${contactName} bilan bog'lanildi`);
      }, 2000);
    } catch {
      toast.error("Mikrofonga ruxsat berilmadi");
      onClose();
    }
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const handleEnd = () => {
    endCall();
    onClose();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <span className="text-3xl font-bold text-primary">{contactName.charAt(0).toUpperCase()}</span>
        </div>

        {/* Name & status */}
        <div>
          <h2 className="text-xl font-semibold text-white">{contactName}</h2>
          <p className="text-sm text-white/60 mt-1">
            {callState === 'connecting' && "Bog'lanilmoqda..."}
            {callState === 'connected' && formatTime(duration)}
            {callState === 'ended' && "Qo'ng'iroq tugadi"}
          </p>
        </div>

        {/* Pulse animation when connecting */}
        {callState === 'connecting' && (
          <div className="flex justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {callState !== 'ended' && (
            <Button size="icon" variant={isMuted ? "destructive" : "secondary"} className="w-14 h-14 rounded-full" onClick={toggleMute}>
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          )}
          <Button size="icon" variant="destructive" className="w-16 h-16 rounded-full" onClick={handleEnd}>
            <PhoneOff className="w-7 h-7" />
          </Button>
        </div>

        <p className="text-xs text-white/40 max-w-xs mx-auto">
          ⚠️ Bu funksiya hozircha demo rejimda ishlaydi. To'liq WebRTC integratsiyasi keyinroq qo'shiladi.
        </p>
      </div>
    </div>
  );
};
