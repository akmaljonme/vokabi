import { AudioCallDialog } from './AudioCallDialog';

interface IncomingCallOverlayProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallOverlay = ({ callerName, onAccept, onReject }: IncomingCallOverlayProps) => {
  return (
    <AudioCallDialog
      contactName={callerName}
      callState="ringing"
      isMuted={false}
      duration={0}
      onToggleMute={() => {}}
      onEnd={onReject}
      onAccept={onAccept}
      onReject={onReject}
    />
  );
};
