import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useDMNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id) return;

        // Fetch sender name
        const { data: sender } = await (supabase.from('profiles') as any)
          .select('full_name, username')
          .eq('user_id', msg.sender_id)
          .maybeSingle();

        const senderName = sender?.username ? `@${sender.username}` : sender?.full_name || 'Foydalanuvchi';
        const preview = msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content;

        // In-app toast
        toast(`${senderName}`, {
          description: preview,
          action: {
            label: "Ko'rish",
            onClick: () => {
              navigate('/community');
            },
          },
          duration: 5000,
        });

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${senderName} dan xabar`, {
            body: preview,
            icon: '/favicon.ico',
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user]);
};
