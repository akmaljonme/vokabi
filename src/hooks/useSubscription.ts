import { useState, useEffect } from 'react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';

export const useSubscription = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setPlan('free');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('plan, expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.plan === 'pro') {
          // Check if expired
          if (data.expires_at && new Date(data.expires_at) < new Date()) {
            setPlan('free');
          } else {
            setPlan('pro');
          }
        } else {
          setPlan('free');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setPlan('free');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return { plan, isPro: plan === 'pro', loading };
};
