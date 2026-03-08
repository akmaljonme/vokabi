import { useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallDialogProps {
  contactName: string;
  callState: 'calling' | 'ringing' | 'connected' | 'ended';
  callMode: 'audio' | 'video';
  isMuted: boolean;
  isCameraOff: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export const AudioCallDialog = ({
  contactName, callState, callMode, isMuted, isCameraOff, duration,
  localStream, remoteStream,
  onToggleMute, onToggleCamera, onEnd, onAccept, onReject,
}: CallDialogProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isVideo = callMode === 'video';

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      <div className="text-center space-y-6 w-full max-w-lg px-4">
        
        {/* Video area */}
        {isVideo && callState === 'connected' && (
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden mb-4">
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Local video pip */}
            <div className="absolute bottom-3 right-3 w-28 h-20 rounded-xl overflow-hidden border-2 border-white/20 bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
              />
              {isCameraOff && (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoOff className="w-5 h-5 text-white/40" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avatar (show for audio calls or non-connected states) */}
        {(!isVideo || callState !== 'connected') && (
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-primary">{contactName.charAt(0).toUpperCase()}</span>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-white">{contactName}</h2>
          <p className="text-sm text-white/60 mt-1">
            {callState === 'calling' && "Qo'ng'iroq qilinmoqda..."}
            {callState === 'ringing' && (isVideo ? "📹 Video qo'ng'iroq..." : "📞 Kiruvchi qo'ng'iroq...")}
            {callState === 'connected' && formatTime(duration)}
            {callState === 'ended' && "Qo'ng'iroq tugadi"}
          </p>
          {callState === 'ringing' && (
            <p className="text-xs text-white/40 mt-1">
              {isVideo ? 'Video' : 'Audio'} qo'ng'iroq
            </p>
          )}
        </div>

        {(callState === 'calling' || callState === 'ringing') && (
          <div className="flex justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          </div>
        )}

        <div className="flex items-center justify-center gap-5">
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
              <Button size="icon" variant={isMuted ? 'destructive' : 'secondary'} className="w-14 h-14 rounded-full" onClick={onToggleMute}>
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              {isVideo && (
                <Button size="icon" variant={isCameraOff ? 'destructive' : 'secondary'} className="w-14 h-14 rounded-full" onClick={onToggleCamera}>
                  {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
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
