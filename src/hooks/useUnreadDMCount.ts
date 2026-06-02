import { useEffect, useState } from 'react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadDMCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    const fetch = async () => {
      const { count: c } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setCount(c ?? 0);
    };

    fetch();

    const channel = supabase.channel('unread-dm-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
};
