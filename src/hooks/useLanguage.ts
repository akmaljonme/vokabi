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
    try {
      const { data } = await supabase
        .from('profiles')
        .select('target_language, learning_purpose, current_level, learning_goal, onboarding_done')
        .eq('user_id', user.id)
        .single();

      setPrefs(data as UserPreferences || {
        target_language: null,
        learning_purpose: null,
        current_level: null,
        learning_goal: null,
        onboarding_done: false,
      });
    } catch {
      setPrefs({ target_language: null, learning_purpose: null, current_level: null, learning_goal: null, onboarding_done: false });
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
