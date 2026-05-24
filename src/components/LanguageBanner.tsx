import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const LanguageBanner = () => {
  const { language, languageName, languageFlag, refetch } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);

  const changeLanguage = async (lang: string) => {
    if (lang === language) { setOpen(false); return; }
    setChanging(true);
    try {
      await supabase.from('profiles').update({ target_language: lang }).eq('user_id', user?.id);
      await refetch();
      toast.success(`${LANGUAGE_FLAGS[lang]} ${LANGUAGE_NAMES[lang]} tanlandi!`);
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setChanging(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
      >
        <span className="text-base">{languageFlag}</span>
        <span className="hidden sm:block">{languageName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-40 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
            >
              <p className="text-xs text-muted-foreground px-3 py-2 border-b border-border font-medium">
                Til o'zgartirish
              </p>
              <div className="py-1 max-h-64 overflow-y-auto">
                {Object.entries(LANGUAGE_NAMES).map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => changeLanguage(id)}
                    disabled={changing}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-base">{LANGUAGE_FLAGS[id]}</span>
                    <span className="text-sm flex-1">{name}</span>
                    {id === language && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
