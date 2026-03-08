import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
type CallMode = 'audio' | 'video';

// Use a module-level variable won't work with multiple instances, so we use ref

export const useWebRTC = (userId: string | undefined) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callMode, setCallMode] = useState<CallMode>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [remoteCallerId, setRemoteCallerId] = useState<string | null>(null);
  const [remoteCallerName, setRemoteCallerName] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentCalleeRef = useRef<string | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callModeRef = useRef<CallMode>('audio');
  const callStateRef = useRef<CallState>('idle');
  const durationRef = useRef(0);
  const callConnectedRef = useRef(false);

  const updateCallState = useCallback((state: CallState) => {
    callStateRef.current = state;
    setCallState(state);
  }, []);

  const playRingtone = useCallback(() => {
    try {
      const audio = new Audio('/ringtone.mp3');
      audio.loop = true;
      audio.volume = 0.7;
      audio.play().catch(() => {});
      ringtoneRef.current = audio;
    } catch {}
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const saveCallMessage = useCallback(async (remoteId: string, wasConnected: boolean, dur: number) => {
    if (!userId) return;
    const mode = callModeRef.current;
    const icon = mode === 'video' ? '📹' : '📞';
    const content = wasConnected
      ? `${icon} ${mode === 'video' ? 'Video' : 'Audio'} qo'ng'iroq · ${formatDuration(dur)}`
      : `${icon} Javobsiz qo'ng'iroq`;
    
    await supabase.from('direct_messages').insert({
      sender_id: userId,
      receiver_id: remoteId,
      content,
    } as any);
  }, [userId]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    pcRef.current?.close();
    pcRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setDuration(0);
    durationRef.current = 0;
    setIsMuted(false);
    setIsCameraOff(false);
    currentCalleeRef.current = null;
    callConnectedRef.current = false;
    stopRingtone();
  }, [stopRingtone]);

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
      console.log('[WebRTC] Remote track received:', e.track.kind, e.streams.length);
      const stream = e.streams[0];
      setRemoteStream(stream);

      // For audio-only or as fallback, attach to DOM audio element
      if (e.track.kind === 'audio') {
        if (!remoteAudioRef.current) {
          const audio = document.createElement('audio');
          audio.autoplay = true;
          (audio as any).playsInline = true;
          audio.id = 'webrtc-remote-audio';
          document.body.appendChild(audio);
          remoteAudioRef.current = audio;
        }
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(err => console.error('[WebRTC] Audio play error:', err));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall(remoteId);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [userId]);

  const getMediaStream = async (mode: CallMode) => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: mode === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  };

  const startCall = useCallback(async (calleeId: string, mode: CallMode = 'audio') => {
    if (!userId) return;
    try {
      callModeRef.current = mode;
      setCallMode(mode);
      const stream = await getMediaStream(mode);
      localStreamRef.current = stream;
      setLocalStream(stream);
      currentCalleeRef.current = calleeId;
      
      const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('user_id', calleeId).single();
      setRemoteCallerName(profile?.username ? `@${profile.username}` : profile?.full_name || 'Foydalanuvchi');
      setRemoteCallerId(calleeId);
      
      updateCallState('calling');
      playRingtone();
      await sendSignal(calleeId, 'call-invite', { mode });
    } catch {
      updateCallState('idle');
    }
  }, [userId, playRingtone, updateCallState]);

  const acceptCall = useCallback(async (callerId: string) => {
    if (!userId) return;
    try {
      stopRingtone();
      const mode = callModeRef.current;
      if (!localStreamRef.current) {
        const stream = await getMediaStream(mode);
        localStreamRef.current = stream;
        setLocalStream(stream);
      }
      currentCalleeRef.current = callerId;
      updateCallState('connected');
      callConnectedRef.current = true;

      await sendSignal(callerId, 'call-accept');

      const pc = createPeerConnection(callerId);
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(callerId, 'offer', { sdp: offer });

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        durationRef.current++;
        setDuration(d => d + 1);
      }, 1000);
    } catch {
      updateCallState('idle');
      cleanup();
    }
  }, [userId, createPeerConnection, cleanup, stopRingtone, updateCallState]);

  const rejectCall = useCallback(async (callerId: string) => {
    if (!userId) return;
    stopRingtone();
    await sendSignal(callerId, 'call-reject');
    updateCallState('idle');
    setRemoteCallerId(null);
    cleanup();
  }, [userId, cleanup, stopRingtone, updateCallState]);

  const endCall = useCallback(async (remoteId?: string) => {
    const targetId = remoteId || currentCalleeRef.current;
    const wasConnected = callConnectedRef.current;
    const dur = durationRef.current;
    if (targetId && userId) {
      await sendSignal(targetId, 'call-end');
      // Save call record in chat
      await saveCallMessage(targetId, wasConnected, dur);
    }
    stopRingtone();
    updateCallState('ended');
    cleanup();
    setTimeout(() => updateCallState('idle'), 1500);
  }, [userId, cleanup, stopRingtone, updateCallState, saveCallMessage]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOff(prev => !prev);
    }
  }, []);

  // Listen for incoming signals — NO callState dependency to avoid channel recreation
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
            if (callStateRef.current !== 'idle') {
              await sendSignal(caller_id, 'call-reject');
              return;
            }
            const mode = signal_data?.mode || 'audio';
            callModeRef.current = mode;
            setCallMode(mode);

            const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('user_id', caller_id).single();
            setRemoteCallerId(caller_id);
            setRemoteCallerName(profile?.username ? `@${profile.username}` : profile?.full_name || 'Foydalanuvchi');
            updateCallState('ringing');
            playRingtone();
            break;
          }
          case 'call-accept': {
            stopRingtone();
            updateCallState('connected');
            callConnectedRef.current = true;
            // Caller side: create PC and add tracks now
            if (localStreamRef.current && !pcRef.current) {
              const remoteId = currentCalleeRef.current || caller_id;
              const pc = createPeerConnection(remoteId);
              localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
            }
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              durationRef.current++;
              setDuration(d => d + 1);
            }, 1000);
            break;
          }
          case 'call-reject': {
            stopRingtone();
            // Save as missed call
            const rejectTarget = currentCalleeRef.current || caller_id;
            saveCallMessage(rejectTarget, false, 0);
            updateCallState('ended');
            cleanup();
            setTimeout(() => updateCallState('idle'), 1500);
            break;
          }
          case 'call-end': {
            stopRingtone();
            updateCallState('ended');
            cleanup();
            setTimeout(() => updateCallState('idle'), 1500);
            break;
          }
          case 'offer': {
            try {
              const pc = pcRef.current || createPeerConnection(caller_id);
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => {
                  if (!pc.getSenders().find(s => s.track === t)) {
                    pc.addTrack(t, localStreamRef.current!);
                  }
                });
              }
              if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal_data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await sendSignal(caller_id, 'answer', { sdp: answer });
              }
            } catch (err) {
              console.error('[WebRTC] Offer handling error:', err);
            }
            break;
          }
          case 'answer': {
            if (pcRef.current && pcRef.current.signalingState === 'have-local-offer') {
              try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal_data.sdp));
              } catch (err) {
                console.error('[WebRTC] Answer handling error:', err);
              }
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
  }, [userId]);

  return {
    callState,
    callMode,
    isMuted,
    isCameraOff,
    duration,
    remoteCallerId,
    remoteCallerName,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
};
