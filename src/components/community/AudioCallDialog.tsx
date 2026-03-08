import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioCallDialogProps {
  contactName: string;
  callState: 'calling' | 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  duration: number;
  onToggleMute: () => void;
  onEnd: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export const AudioCallDialog = ({
  contactName, callState, isMuted, duration,
  onToggleMute, onEnd, onAccept, onReject,
}: AudioCallDialogProps) => {
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <span className="text-3xl font-bold text-primary">{contactName.charAt(0).toUpperCase()}</span>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">{contactName}</h2>
          <p className="text-sm text-white/60 mt-1">
            {callState === 'calling' && "Qo'ng'iroq qilinmoqda..."}
            {callState === 'ringing' && "Kiruvchi qo'ng'iroq..."}
            {callState === 'connected' && formatTime(duration)}
            {callState === 'ended' && "Qo'ng'iroq tugadi"}
          </p>
        </div>

        {(callState === 'calling' || callState === 'ringing') && (
          <div className="flex justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
          {callState === 'ringing' && (
            <>
              <Button size="icon" className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700" onClick={onAccept}>
                <PhoneIncoming className="w-7 h-7 text-white" />
              </Button>
              <Button size="icon" variant="destructive" className="w-16 h-16 rounded-full" onClick={onReject}>
                <PhoneOff className="w-7 h-7" />
              </Button>
            </>
          )}
          {(callState === 'calling' || callState === 'connected') && (
            <>
              {callState === 'connected' && (
                <Button size="icon" variant={isMuted ? 'destructive' : 'secondary'} className="w-14 h-14 rounded-full" onClick={onToggleMute}>
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
              )}
              <Button size="icon" variant="destructive" className="w-16 h-16 rounded-full" onClick={onEnd}>
                <PhoneOff className="w-7 h-7" />
              </Button>
            </>
          )}
          {callState === 'ended' && (
            <Button size="icon" variant="destructive" className="w-16 h-16 rounded-full" onClick={onEnd}>
              <PhoneOff className="w-7 h-7" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
