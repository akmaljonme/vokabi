import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPreferences {
  target_language: string | null;
  learning_purpose: string | null;
  current_level: string | null;
  learning_goal: string | null;
  onboarding_done: boolean;
}

export const LANGUAGE_NAMES: Record<string, string> = {
  english:  'Ingliz tili',
  chinese:  'Xitoy tili',
  german:   'Nemis tili',
  french:   'Fransuz tili',
  spanish:  'Ispan tili',
  japanese: 'Yapon tili',
  korean:   'Koreys tili',
  arabic:   'Arab tili',
  russian:  'Rus tili',
  italian:  'Italyan tili',
};

export const LANGUAGE_FLAGS: Record<string, string> = {
  english:  '🇬🇧',
  chinese:  '🇨🇳',
  german:   '🇩🇪',
  french:   '🇫🇷',
  spanish:  '🇪🇸',
  japanese: '🇯🇵',
  korean:   '🇰🇷',
  arabic:   '🇸🇦',
  russian:  '🇷🇺',
  italian:  '🇮🇹',
};

export const useLanguage = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // LocalStorage fallback (DB ustunlari yo'q bo'lsa)
    const localRaw = localStorage.getItem('vokabi_prefs');
    const localPrefs = localRaw ? JSON.parse(localRaw) : null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('target_language, learning_purpose, current_level, learning_goal, onboarding_done')
        .eq('user_id', user.id)
        .single();

      if (error || !data) throw new Error('no data');

      const merged: UserPreferences = {
        target_language: (data as any).target_language ?? localPrefs?.target_language ?? null,
        learning_purpose: (data as any).learning_purpose ?? localPrefs?.learning_purpose ?? null,
        current_level: (data as any).current_level ?? localPrefs?.current_level ?? null,
        learning_goal: (data as any).learning_goal ?? localPrefs?.learning_goal ?? null,
        onboarding_done: (data as any).onboarding_done ?? localPrefs?.onboarding_done ?? true,
      };
      setPrefs(merged);
    } catch {
      // DB xato — localStorage dan ol
      if (localPrefs) {
        setPrefs(localPrefs);
      } else {
        setPrefs({ target_language: null, learning_purpose: null, current_level: null, learning_goal: null, onboarding_done: false });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const refetch = () => fetchPrefs();

  return {
    prefs,
    loading,
    refetch,
    language: prefs?.target_language || 'english',
    languageName: LANGUAGE_NAMES[prefs?.target_language || 'english'] || 'Ingliz tili',
    languageFlag: LANGUAGE_FLAGS[prefs?.target_language || 'english'] || '🇬🇧',
    needsOnboarding: !prefs?.onboarding_done,
  };
};
