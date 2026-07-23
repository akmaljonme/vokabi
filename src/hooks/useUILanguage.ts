import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase as _sbClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UILanguage, UI_LANGUAGE_STORAGE_KEY, SUPPORTED_UI_LANGUAGES } from '@/i18n';

const supabase: any = _sbClient;

export const useUILanguage = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Foydalanuvchi tizimga kirganda, DB'dagi saqlangan tilni yuklab olish
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('ui_language')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.ui_language && SUPPORTED_UI_LANGUAGES.includes(data.ui_language)) {
          if (i18n.language !== data.ui_language) {
            i18n.changeLanguage(data.ui_language);
            localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, data.ui_language);
          }
        }
      } catch {
        // profiles.ui_language mavjud bo'lmasa yoki xatolik bo'lsa, localStorage'dagi qiymat bilan davom etamiz
      }
    })();
  }, [user, i18n]);

  const setUILanguage = useCallback(async (lang: UILanguage) => {
    setLoading(true);
    try {
      i18n.changeLanguage(lang);
      localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, lang);

      if (user) {
        await supabase
          .from('profiles')
          .update({ ui_language: lang })
          .eq('user_id', user.id);
      }
    } finally {
      setLoading(false);
    }
  }, [user, i18n]);

  return {
    currentLanguage: i18n.language as UILanguage,
    setUILanguage,
    loading,
  };
};
