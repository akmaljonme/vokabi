import { useCall } from '@/contexts/CallContext';
import { AudioCallDialog } from './AudioCallDialog';

export const GlobalCallOverlay = () => {
  const call = useCall();
  
  if (call.callState === 'idle') return null;

  return (
    <AudioCallDialog
      contactName={call.remoteCallerName || 'Foydalanuvchi'}
      callState={call.callState as any}
      callMode={call.callMode}
      isMuted={call.isMuted}
      isCameraOff={call.isCameraOff}
      duration={call.duration}
      localStream={call.localStream}
      remoteStream={call.remoteStream}
      onToggleMute={call.toggleMute}
      onToggleCamera={call.toggleCamera}
      onEnd={() => call.endCall(call.remoteCallerId || undefined)}
      onAccept={call.remoteCallerId ? () => call.acceptCall(call.remoteCallerId!) : undefined}
      onReject={call.remoteCallerId ? () => call.rejectCall(call.remoteCallerId!) : undefined}
    />
  );
};
