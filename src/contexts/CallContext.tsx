import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';

type WebRTCReturn = ReturnType<typeof useWebRTC>;

const CallContext = createContext<WebRTCReturn | null>(null);

export const useCall = () => {
  const ctx = useContext(CallContext);
  return ctx as WebRTCReturn;
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const webrtc = useWebRTC(user?.id);

  return (
    <CallContext.Provider value={webrtc}>
      {children}
    </CallContext.Provider>
  );
};
