import { useState } from 'react';
import { ArrowLeft, BookOpen, Headphones, Brain, Lightbulb, BookMarked, FileDown, Mic, PenTool } from 'lucide-react';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { useActiveTests, TestInfo } from '@/hooks/useTests';
import { Loader2 } from 'lucide-react';
import { generateMockTest } from '@/data/mockData';
import { generateTestPDF } from '@/utils/pdfGenerator';
import { motion } from 'framer-motion';

interface SkillSelectionProps {
  level: CEFRLevel;
  onSelectMock: (skill: SkillType, mockId: number, testId?: string) => void;
  onBack: () => void;
  hideVocabulary?: boolean;
  vocabularyOnly?: boolean;
}

const BOOK_NAMES = ["1-Kitob", "2-Kitob", "3-Kitob", "4-Kitob", "5-Kitob", "6-Kitob"];

export const SkillSelection = ({ level, onSelectMock, onBack, hideVocabulary, vocabularyOnly }: SkillSelectionProps) => {
  const { readingTests, listeningTests, vocabularyTests, grammarTests, loading } = useActiveTests(vocabularyOnly ? undefined : level);
  const [selectedVocabBook, setSelectedVocabBook] = useState<number | null>(null);
  const defaultTab = vocabularyOnly ? 'vocabulary' : (hideVocabulary ? 'grammar' : 'vocabulary');
  const [activeTab, setActiveTab] = useState<SkillType>(defaultTab as SkillType);

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
            <button
              onClick={(e) => handleDownloadPDF(e, skill, index)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
              title="PDF yuklab olish"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
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
            <button
              onClick={(e) => handleDownloadPDF(e, skill, index)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
              title="PDF yuklab olish"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
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
            return (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(tab.key); setSelectedVocabBook(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          {activeTab === 'vocabulary' && !selectedVocabBook && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">Kitobni Tanlang</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BOOK_NAMES.map((name, i) => {
                  const bookNum = i + 1;
                  const unitCount = getVocabBookUnits(bookNum).length;
                  return (
                    <motion.button
                      key={bookNum}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      onClick={() => setSelectedVocabBook(bookNum)}
                      className="card-elevated flex flex-col items-center gap-3 p-6 hover:border-primary/50"
                    >
                      <BookMarked className="w-8 h-8 text-primary" />
                      <div className="font-display font-bold">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {unitCount > 0 ? `${unitCount} ta unit` : "Hali bo'sh"}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'vocabulary' && selectedVocabBook && (
            <div>
              <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">
                {BOOK_NAMES[selectedVocabBook - 1]} — Unitlar
              </h2>
              {renderUnitList(getVocabBookUnits(selectedVocabBook), 'vocabulary')}
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
        </div>
      </div>
    </div>
  );
};
