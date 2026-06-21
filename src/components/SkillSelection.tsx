import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, BookOpen, Headphones, Brain, Lightbulb, BookMarked, FileDown, Mic, PenTool, Crown, Lock, Share2, Copy, Check, X } from 'lucide-react';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { useActiveTests, TestInfo } from '@/hooks/useTests';
import { Loader2 } from 'lucide-react';
import { generateMockTest } from '@/data/mockData';
import { generateTestPDF } from '@/utils/pdfGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase as _sb } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
const supabase: any = _sb;

// ─── Share Popup ───
const ShareTestPopup = ({ test, skill, level, mockId, onClose }: {
  test: TestInfo; skill: SkillType; level: CEFRLevel; mockId: number; onClose: () => void;
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const generateLink = async () => {
    if (!user) { toast.error("Ulashish uchun tizimga kiring"); return; }
    setLoading(true);
    try {
      const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

      let questions: any[] = [];

      // Try to fetch real questions from Supabase
      if (test.id) {
        const { data: dbQuestions } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', test.id)
          .order('order_index', { ascending: true });

        if (dbQuestions && dbQuestions.length > 0) {
          questions = dbQuestions.map((q: any) => {
            const opts: Record<string, string> = {};
            const rawOptions = Array.isArray(q.options) ? q.options : [];
            rawOptions.forEach((opt: string, i: number) => { opts[KEYS[i]] = opt; });

            const rawCorrect = String(q.correct_answer || '').trim();
            let correctKey = 'A';

            if (KEYS.includes(rawCorrect)) {
              // Already A/B/C/D format
              correctKey = rawCorrect;
            } else if (/^[0-9]+$/.test(rawCorrect)) {
              // Numeric index format "0", "1", "2", "3"
              const idx = parseInt(rawCorrect);
              correctKey = KEYS[idx] || 'A';
            } else if (rawCorrect) {
              // Full text — find by matching option text
              const found = rawOptions.findIndex((o: string) =>
                o?.toLowerCase().trim() === rawCorrect.toLowerCase()
              );
              correctKey = found >= 0 ? KEYS[found] : 'A';
            }

            return {
              question: q.question_text,
              options: opts,
              correct: correctKey,
              explanation: q.explanation || '',
            };
          });
        }
      }

      // Fallback to mockData if no DB questions
      if (questions.length === 0) {
        const mockTest = generateMockTest(mockId, level, skill);
        questions = mockTest.parts.flatMap((p: any) =>
          p.questions.map((q: any) => {
            const opts: Record<string, string> = {};
            if (Array.isArray(q.options)) {
              q.options.forEach((opt: string, i: number) => { opts[KEYS[i]] = opt; });
            }
            const correctIdx = Array.isArray(q.options)
              ? q.options.findIndex((o: string) => o === q.correctAnswer)
              : -1;
            return {
              question: q.question,
              options: opts,
              correct: correctIdx >= 0 ? KEYS[correctIdx] : 'A',
              explanation: q.explanation || '',
            };
          })
        );
      }

      const { data, error } = await supabase.from("shared_tests").insert({
        test_id: test.id || `${level}_${skill}_${mockId}`,
        level,
        skill,
        mock_id: mockId,
        title: test.title || `${level} ${skill.charAt(0).toUpperCase() + skill.slice(1)} — Unit ${mockId}`,
        questions,
        created_by: user.id,
      }).select("id").single();

      if (error) throw error;
      setShareUrl(`${window.location.origin}/shared-test/${data.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Nusxa olindi! 🎉");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = shareUrl ? [
    {
      name: "Telegram",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.554c-.149.668-.537.83-1.088.517l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.085 14.6l-2.953-.924c-.642-.2-.655-.642.136-.951l11.527-4.445c.537-.194 1.006.131.767.968z"/>
        </svg>
      ),
      color: "bg-[#2AABEE]",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`📚 ${level} ${skill} testini sinab ko'ring!\n🔗 ${shareUrl}`)}`,
    },
    {
      name: "WhatsApp",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: "bg-[#25D366]",
      url: `https://wa.me/?text=${encodeURIComponent(`📚 ${level} ${skill} testini sinab ko'ring!\n🔗 ${shareUrl}`)}`,
    },
    {
      name: "Instagram",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
      color: "bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
      url: `https://www.instagram.com/`,
      note: "Havolani nusxa oling va Instagram da joylashtiring",
    },
    {
      name: "Facebook",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.994 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "bg-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
  ] : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      >
        <motion.div
          ref={popupRef}
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base">Testni ulashish 🔗</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{level} {skill} — Unit {mockId}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!shareUrl ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={generateLink}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Havola yaratilmoqda...</>
              ) : (
                <><Share2 className="w-4 h-4" /> Havola yaratish</>
              )}
            </motion.button>
          ) : (
            <>
              {/* URL box */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border mb-5">
                <input readOnly value={shareUrl} className="flex-1 text-xs bg-transparent font-mono truncate outline-none text-muted-foreground" />
                <button onClick={copy} className="shrink-0 flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all">
                  {copied ? <><Check className="w-3 h-3" /> Nusxa!</> : <><Copy className="w-3 h-3" /> Nusxa</>}
                </button>
              </div>

              {/* Social buttons */}
              <p className="text-xs text-muted-foreground font-semibold mb-3">Ulashish:</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {shareLinks.map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    onClick={s.name === "Instagram" ? (e) => { e.preventDefault(); copy(); toast.info("Havola nusxa olindi — Instagram ga joylashtiring"); } : undefined}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl ${s.color} text-white hover:opacity-90 transition-all hover:scale-105`}
                  >
                    {s.icon}
                    <span className="text-[10px] font-bold">{s.name}</span>
                  </a>
                ))}
              </div>

              {/* QR hint */}
              <div className="rounded-2xl bg-muted/50 border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground font-semibold">
                  📱 Havola orqali kirganlar testni <strong>kirmasdan</strong> ham topshira oladi
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface SkillSelectionProps {
  level: CEFRLevel;
  onSelectMock: (skill: SkillType, mockId: number, testId?: string) => void;
  onBack: () => void;
  hideVocabulary?: boolean;
  vocabularyOnly?: boolean;
}

const BOOK_NAMES = ["1-Kitob", "2-Kitob", "3-Kitob", "4-Kitob", "5-Kitob", "6-Kitob"];

export const SkillSelection = ({ level, onSelectMock, onBack, hideVocabulary, vocabularyOnly }: SkillSelectionProps) => {
  const { readingTests, listeningTests, vocabularyTests, grammarTests, speakingTests, writingTests, loading } = useActiveTests(vocabularyOnly ? undefined : level);
  const [selectedVocabBook, setSelectedVocabBook] = useState<number | null>(null);
  const defaultTab = vocabularyOnly ? 'vocabulary' : (hideVocabulary ? 'grammar' : 'vocabulary');
  const [activeTab, setActiveTab] = useState<SkillType>(defaultTab as SkillType);
  const { isPro } = useSubscription();
  const [sharePopup, setSharePopup] = useState<{ test: TestInfo; skill: SkillType; mockId: number } | null>(null);

  const PRO_SKILLS: SkillType[] = ['writing', 'speaking'];
  const isProSkill = (skill: SkillType) => PRO_SKILLS.includes(skill);
  const isLocked = (skill: SkillType) => isProSkill(skill) && !isPro;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getVocabBookUnits = (bookNumber: number) =>
    vocabularyTests.filter(t => t.bookNumber === bookNumber).sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));

  const grammarUnits = grammarTests.sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));

  const allTabs = [
    { key: 'vocabulary' as SkillType, label: "Lug'at", icon: Lightbulb },
    { key: 'grammar' as SkillType, label: 'Grammatika', icon: Brain },
    { key: 'reading' as SkillType, label: 'Reading', icon: BookOpen },
    { key: 'listening' as SkillType, label: 'Listening', icon: Headphones },
    { key: 'writing' as SkillType, label: 'Writing', icon: PenTool },
    { key: 'speaking' as SkillType, label: 'Speaking', icon: Mic },
  ];

  const tabs = vocabularyOnly
    ? allTabs.filter(t => t.key === 'vocabulary')
    : hideVocabulary ? allTabs.filter(t => t.key !== 'vocabulary') : allTabs;

  const handleDownloadPDF = (e: React.MouseEvent, skill: SkillType, index: number) => {
    e.stopPropagation();
    const test = generateMockTest(index + 1, level, skill);
    generateTestPDF(test);
  };

  const renderUnitList = (tests: TestInfo[], skill: SkillType) => {
    if (tests.length === 0) {
      return <div className="text-center py-12 text-muted-foreground text-sm">Hali testlar qo'shilmagan</div>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="relative group"
          >
            <button
              onClick={() => onSelectMock(skill, index + 1, test.id)}
              className="w-full p-4 rounded-xl border border-border/50 bg-card text-left transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="font-semibold text-sm">Unit {test.unitNumber || index + 1}</div>
              <div className="text-xs text-muted-foreground mt-1">{test.questionCount} ta savol</div>
            </button>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => { e.stopPropagation(); setSharePopup({ test, skill, mockId: index + 1 }); }}
                className="p-1 rounded-lg bg-muted/80 hover:bg-violet-500/20 text-muted-foreground hover:text-violet-500 transition-all"
                title="Ulashish"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDownloadPDF(e, skill, index)}
                className="p-1 rounded-lg bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                title="PDF yuklab olish"
              >
                <FileDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTestList = (tests: TestInfo[], skill: SkillType) => {
    if (tests.length === 0) {
      return <div className="text-center py-12 text-muted-foreground text-sm">Hali testlar qo'shilmagan</div>;
    }
    return (
      <div className="grid grid-cols-1 gap-3">
        {tests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <button
              onClick={() => onSelectMock(skill, index + 1, test.id)}
              className="w-full p-4 rounded-xl border border-border/50 bg-card text-left transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="font-medium text-sm">{test.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {test.questionCount} ta savol • {Math.floor(test.timeLimit / 60)} daqiqa
              </div>
            </button>
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => handleDownloadPDF(e, skill, index)}
                className="p-1.5 rounded-lg bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                title="PDF yuklab olish"
              >
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      {/* Share popup */}
      {sharePopup && (
        <ShareTestPopup
          test={sharePopup.test}
          skill={sharePopup.skill}
          level={level}
          mockId={sharePopup.mockId}
          onClose={() => setSharePopup(null)}
        />
      )}
      <div className="container mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={selectedVocabBook ? () => setSelectedVocabBook(null) : onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {selectedVocabBook ? "Kitoblarga Qaytish" : "Darajalarga Qaytish"}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {!vocabularyOnly && (
            <span className="premium-badge mb-4 inline-flex">
              <span className="font-bold">{level}</span> Daraja
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight">
            {vocabularyOnly ? (
              <><span className="text-gradient">Lug'at</span> Testlari</>
            ) : (
              <>Test Turini <span className="text-gradient">Tanlang</span></>
            )}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const locked = isLocked(tab.key);
            return (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(tab.key); setSelectedVocabBook(null); }}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {locked && <Crown className="w-3.5 h-3.5 text-amber-500 ml-1" />}
              </motion.button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          {activeTab === 'vocabulary' && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Lug'at Testlari</h2>
              {vocabularyTests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Hali testlar qo'shilmagan</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {vocabularyTests
                    .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0))
                    .map((test, index) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="relative group"
                    >
                      <button
                        onClick={() => onSelectMock('vocabulary', index + 1, test.id)}
                        className="w-full p-4 rounded-xl border border-border/50 bg-card text-left transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="font-semibold text-sm">Unit {test.unitNumber || index + 1}</div>
                        <div className="text-xs text-muted-foreground mt-1">{test.questionCount} ta savol</div>
                      </button>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSharePopup({ test, skill: 'vocabulary', mockId: index + 1 }); }}
                          className="p-1 rounded-lg bg-muted/80 hover:bg-violet-500/20 text-muted-foreground hover:text-violet-500 transition-all"
                          title="Ulashish"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPDF(e, 'vocabulary', index)}
                          className="p-1 rounded-lg bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                          title="PDF yuklab olish"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'grammar' && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Grammatika Unitlari</h2>
              {renderUnitList(grammarUnits, 'grammar')}
            </div>
          )}

          {activeTab === 'reading' && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Reading Testlari</h2>
              {renderTestList(readingTests, 'reading')}
            </div>
          )}

          {activeTab === 'listening' && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Listening Testlari</h2>
              {renderTestList(listeningTests, 'listening')}
            </div>
          )}

          {activeTab === 'writing' && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Writing Testlari</h2>
              {isLocked('writing') ? <ProLockCard skill="Writing" /> : renderTestList(writingTests, 'writing')}
            </div>
          )}

          {activeTab === 'speaking' && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Speaking Testlari</h2>
              {isLocked('speaking') ? <ProLockCard skill="Speaking" /> : (
                speakingTests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Hali testlar qo'shilmagan</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {speakingTests.map((test, index) => (
                      <motion.div key={test.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative group">
                        <button
                          onClick={() => onSelectMock('speaking', index + 1, test.id)}
                          className="w-full p-4 rounded-xl border border-border/50 bg-card text-left transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div className="font-medium text-sm">{test.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{test.questionCount} ta savol • {Math.floor(test.timeLimit / 60)} daqiqa</div>
                        </button>
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSharePopup({ test, skill: 'speaking', mockId: index + 1 }); }}
                            className="p-1.5 rounded-lg bg-muted/80 hover:bg-violet-500/20 text-muted-foreground hover:text-violet-500 transition-all"
                            title="Ulashish"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPDF(e, 'speaking', index)}
                            className="p-1.5 rounded-lg bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                            title="PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProLockCard = ({ skill }: { skill: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-xl mx-auto card-elevated p-8 text-center border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-primary/5"
  >
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
      <Lock className="w-8 h-8 text-amber-500" />
    </div>
    <div className="flex items-center justify-center gap-2 mb-2">
      <Crown className="w-5 h-5 text-amber-500" />
      <h3 className="font-display font-bold text-xl">{skill} — Pro versiya</h3>
    </div>
    <p className="text-sm text-muted-foreground mb-1">
      {skill} testlari va AI baholash <span className="font-semibold text-foreground">Pro</span> foydalanuvchilar uchun.
    </p>
    <p className="text-xs text-muted-foreground mb-6">
      IELTS standarti bo'yicha 4 ta mezon, batafsil tahlil, tuzatilgan namuna va video tavsiyalar.
    </p>
    <a
      href="https://t.me/vokabi_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
    >
      <Crown className="w-4 h-4" />
      Pro versiyaga o'tish (@vokabi_bot)
    </a>
  </motion.div>
);
