import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingData {
  target_language: string;
  learning_purpose: string;
  current_level: string;
  learning_goal: string;
}

interface LanguageOnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

// ── Step data ──────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'english',  flag: '🇬🇧', name: 'Ingliz tili',   native: 'English' },
  { id: 'chinese',  flag: '🇨🇳', name: 'Xitoy tili',    native: '中文' },
  { id: 'german',   flag: '🇩🇪', name: 'Nemis tili',    native: 'Deutsch' },
  { id: 'french',   flag: '🇫🇷', name: 'Fransuz tili',  native: 'Français' },
  { id: 'spanish',  flag: '🇪🇸', name: 'Ispan tili',    native: 'Español' },
  { id: 'japanese', flag: '🇯🇵', name: 'Yapon tili',    native: '日本語' },
  { id: 'korean',   flag: '🇰🇷', name: 'Koreys tili',   native: '한국어' },
  { id: 'arabic',   flag: '🇸🇦', name: 'Arab tili',     native: 'العربية' },
  { id: 'russian',  flag: '🇷🇺', name: 'Rus tili',      native: 'Русский' },
  { id: 'italian',  flag: '🇮🇹', name: 'Italyan tili',  native: 'Italiano' },
];

const PURPOSES = [
  { id: 'travel',    emoji: '✈️',  label: 'Sayohat uchun' },
  { id: 'work',      emoji: '💼',  label: 'Ish uchun' },
  { id: 'study',     emoji: '🎓',  label: "Ta'lim uchun" },
  { id: 'exam',      emoji: '📝',  label: 'Imtihonga tayyorlanish' },
  { id: 'hobby',     emoji: '🎯',  label: 'Qiziqish sifatida' },
  { id: 'migration', emoji: '🌍',  label: 'Chet elga ko\'chish' },
];

const LEVELS = [
  { id: 'A1', label: 'Boshlang\'ich', desc: 'Hech narsa bilmayman' },
  { id: 'A2', label: 'Elementar',    desc: 'Ozgina bilaman' },
  { id: 'B1', label: "O'rta",        desc: 'Gaplasha olaman' },
  { id: 'B2', label: "O'rta-yuqori", desc: 'Yaxshi bilaman' },
  { id: 'C1', label: 'Ilg\'or',      desc: 'Deyarli mukammal' },
  { id: 'C2', label: 'Mukammal',     desc: 'Ona tilim kabi' },
];

const GOALS = [
  { id: 'ielts',        emoji: '🏆', label: 'IELTS 6.0+' },
  { id: 'cefr',         emoji: '📜', label: 'CEFR Sertifikat' },
  { id: 'conversation', emoji: '💬', label: 'Erkin suhbat' },
  { id: 'business',     emoji: '💼', label: 'Biznes til' },
  { id: 'kids',         emoji: '🧒', label: "Farzandim uchun" },
  { id: 'general',      emoji: '📚', label: 'Umumiy o\'rganish' },
];

const STEPS = ['Til', 'Sabab', 'Daraja', 'Maqsad'];

export const LanguageOnboarding = ({ onComplete }: LanguageOnboardingProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    target_language: '',
    learning_purpose: '',
    current_level: '',
    learning_goal: '',
  });

  const canNext = () => {
    if (step === 0) return !!data.target_language;
    if (step === 1) return !!data.learning_purpose;
    if (step === 2) return !!data.current_level;
    if (step === 3) return !!data.learning_goal;
    return false;
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      setSaving(true);
      try {
        // Avval mavjud ustunlar bilan urinib ko'rish
        const { error } = await supabase.from('profiles').update({
          target_language: data.target_language,
          learning_purpose: data.learning_purpose,
          current_level: data.current_level,
          learning_goal: data.learning_goal,
          onboarding_done: true,
        }).eq('user_id', user?.id);

        if (error) {
          // Ustunlar yo'q bo'lsa, faqat mavjud ustunlarni saqlash
          console.warn('Full update failed, trying partial:', error.message);
          await supabase.from('profiles').update({
            target_language: data.target_language,
          }).eq('user_id', user?.id).throwOnError();
        }
      } catch (e) {
        console.warn('DB save failed, using localStorage fallback:', e);
      } finally {
        // DB muvaffaqiyatli bo'lmasa ham — localStorage ga saqla va davom et
        localStorage.setItem('vokabi_prefs', JSON.stringify({
          ...data,
          onboarding_done: true,
        }));
        setSaving(false);
        onComplete(data);
      }
    }
  };

  const selectedLang = LANGUAGES.find(l => l.id === data.target_language);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center p-4">
      <div className="w-full max-w-lg flex flex-col h-full">

        {/* Header */}
        <div className="text-center py-6 shrink-0">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-2xl">🌍</span>
          </motion.div>
          <h1 className="text-2xl font-bold mb-1">Vokabi ga xush kelibsiz!</h1>
          <p className="text-muted-foreground text-sm">Sizga mos dashboard yaratamiz</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${i < step ? 'bg-primary text-primary-foreground' :
                  i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                  'bg-muted text-muted-foreground'}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content — scrollable */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 flex-1 overflow-y-auto mb-4 min-h-0"
          >

            {/* Step 0 — Til tanlash */}
            {step === 0 && (
              <div>
                <h2 className="font-semibold text-lg mb-1">Qaysi tilni o'rganmoqchisiz?</h2>
                <p className="text-muted-foreground text-sm mb-4">Dashboardingiz shu tilga mos bo'ladi</p>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setData(d => ({ ...d, target_language: lang.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                        ${data.target_language === lang.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <p className="font-medium text-sm">{lang.name}</p>
                        <p className="text-xs text-muted-foreground">{lang.native}</p>
                      </div>
                      {data.target_language === lang.id && (
                        <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — Sabab */}
            {step === 1 && (
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  Nima uchun {selectedLang?.name}ni o'rganmoqchisiz?
                </h2>
                <p className="text-muted-foreground text-sm mb-4">Bu sizga mos kontent ko'rsatishga yordam beradi</p>
                <div className="grid grid-cols-2 gap-2">
                  {PURPOSES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setData(d => ({ ...d, learning_purpose: p.id }))}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                        ${data.learning_purpose === p.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                    >
                      <span className="text-xl">{p.emoji}</span>
                      <span className="font-medium text-sm">{p.label}</span>
                      {data.learning_purpose === p.id && (
                        <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Daraja */}
            {step === 2 && (
              <div>
                <h2 className="font-semibold text-lg mb-1">Hozirgi darajangiz qanday?</h2>
                <p className="text-muted-foreground text-sm mb-4">Aniq bilmasangiz ham taxminan tanlang</p>
                <div className="space-y-2">
                  {LEVELS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setData(d => ({ ...d, current_level: l.id }))}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left
                        ${data.current_level === l.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                        ${data.current_level === l.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {l.id}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{l.label}</p>
                        <p className="text-xs text-muted-foreground">{l.desc}</p>
                      </div>
                      {data.current_level === l.id && (
                        <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Maqsad */}
            {step === 3 && (
              <div>
                <h2 className="font-semibold text-lg mb-1">Asosiy maqsadingiz nima?</h2>
                <p className="text-muted-foreground text-sm mb-4">Sizga mos mashqlar tavsiya qilamiz</p>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setData(d => ({ ...d, learning_goal: g.id }))}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                        ${data.learning_goal === g.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                    >
                      <span className="text-xl">{g.emoji}</span>
                      <span className="font-medium text-sm">{g.label}</span>
                      {data.learning_goal === g.id && (
                        <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation — always visible at bottom */}
        <div className="flex gap-3 shrink-0 pb-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext() || saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {step === 3 ? "Boshlash 🚀" : "Davom etish"}
                {step < 3 && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4 shrink-0">
          {step + 1} / {STEPS.length} — {STEPS[step]}
        </p>
      </div>
    </div>
  );
};
