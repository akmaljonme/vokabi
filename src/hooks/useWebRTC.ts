import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export const useWebRTC = (userId: string | undefined) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [remoteCallerId, setRemoteCallerId] = useState<string | null>(null);
  const [remoteCallerName, setRemoteCallerName] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentCalleeRef = useRef<string | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setDuration(0);
    setIsMuted(false);
    currentCalleeRef.current = null;
  }, []);

  const sendSignal = async (calleeId: string, signalType: string, signalData?: any) => {
    if (!userId) return;
    await supabase.from('call_signals').insert({
      caller_id: userId,
      callee_id: calleeId,
      signal_type: signalType,
      signal_data: signalData || null,
    } as any);
  };

  const createPeerConnection = useCallback((remoteId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal(remoteId, 'ice-candidate', { candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play().catch(() => {});
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall(remoteId);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [userId]);

  const startCall = useCallback(async (calleeId: string) => {
    if (!userId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      currentCalleeRef.current = calleeId;
      
      // Fetch callee name for display
      const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('user_id', calleeId).single();
      setRemoteCallerName(profile?.username ? `@${profile.username}` : profile?.full_name || 'Foydalanuvchi');
      setRemoteCallerId(calleeId);
      
      setCallState('calling');
      await sendSignal(calleeId, 'call-invite');
    } catch {
      setCallState('idle');
    }
  }, [userId]);

  const acceptCall = useCallback(async (callerId: string) => {
    if (!userId) return;
    try {
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
      }
      currentCalleeRef.current = callerId;
      setCallState('connected');
      setRemoteCallerId(null);

      // Send accept signal
      await sendSignal(callerId, 'call-accept');

      // Create offer (callee creates the offer after accepting)
      const pc = createPeerConnection(callerId);
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(callerId, 'offer', { sdp: offer });

      // Start timer
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      setCallState('idle');
      cleanup();
    }
  }, [userId, createPeerConnection, cleanup]);

  const rejectCall = useCallback(async (callerId: string) => {
    if (!userId) return;
    await sendSignal(callerId, 'call-reject');
    setCallState('idle');
    setRemoteCallerId(null);
    cleanup();
  }, [userId, cleanup]);

  const endCall = useCallback(async (remoteId?: string) => {
    const targetId = remoteId || currentCalleeRef.current;
    if (targetId && userId) {
      await sendSignal(targetId, 'call-end');
    }
    setCallState('ended');
    cleanup();
    setTimeout(() => setCallState('idle'), 1500);
  }, [userId, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  }, []);

  // Listen for incoming signals
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`calls-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_signals',
        filter: `callee_id=eq.${userId}`,
      }, async (payload) => {
        const signal = payload.new as any;
        const { signal_type, signal_data, caller_id } = signal;

        switch (signal_type) {
          case 'call-invite': {
            // Incoming call
            if (callState !== 'idle') {
              // Busy - auto reject
              await sendSignal(caller_id, 'call-reject');
              return;
            }
            // Fetch caller name
            const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('user_id', caller_id).single();
            setRemoteCallerId(caller_id);
            setRemoteCallerName(profile?.username ? `@${profile.username}` : profile?.full_name || 'Foydalanuvchi');
            setCallState('ringing');
            break;
          }
          case 'call-accept': {
            // Our call was accepted, now wait for offer from callee
            setCallState('connected');
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
            break;
          }
          case 'call-reject': {
            setCallState('ended');
            cleanup();
            setTimeout(() => setCallState('idle'), 1500);
            break;
          }
          case 'call-end': {
            setCallState('ended');
            cleanup();
            setTimeout(() => setCallState('idle'), 1500);
            break;
          }
          case 'offer': {
            // Received offer - create answer
            const pc = pcRef.current || createPeerConnection(caller_id);
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(t => {
                if (!pc.getSenders().find(s => s.track === t)) {
                  pc.addTrack(t, localStreamRef.current!);
                }
              });
            }
            await pc.setRemoteDescription(new RTCSessionDescription(signal_data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal(caller_id, 'answer', { sdp: answer });
            break;
          }
          case 'answer': {
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal_data.sdp));
            }
            break;
          }
          case 'ice-candidate': {
            if (pcRef.current && signal_data?.candidate) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(signal_data.candidate));
              } catch {}
            }
            break;
          }
        }
      }).subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId, callState]);

  return {
    callState,
    isMuted,
    duration,
    remoteCallerId,
    remoteCallerName,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  };
};
