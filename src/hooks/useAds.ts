import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string;
  type: 'banner' | 'popup' | 'sidebar';
  position: string;
  priority: number;
}

export const useAds = (type: 'banner' | 'popup' | 'sidebar') => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchAds();
  }, [user, type]);

  const fetchAds = async () => {
    try {
      // Foydalanuvchi pro yoki free ekanligini tekshir
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user?.id)
        .maybeSingle();

      const isPro = sub?.plan === 'pro';
      if (isPro) { setAds([]); setLoading(false); return; } // Pro ga reklama yo'q

      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .eq('show_to', 'free')
        .or('end_date.is.null,end_date.gt.' + new Date().toISOString())
        .order('priority', { ascending: false });

      setAds((data as Advertisement[]) || []);
    } catch { setAds([]); }
    finally { setLoading(false); }
  };

  const trackView = async (adId: string) => {
    await supabase.rpc('increment_ad_stat', { ad_id: adId, stat_type: 'view' });
  };

  const trackClick = async (adId: string) => {
    await supabase.rpc('increment_ad_stat', { ad_id: adId, stat_type: 'click' });
  };

  return { ads, loading, trackView, trackClick };
};
