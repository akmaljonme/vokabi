import { useState } from 'react';
import { ArrowLeft, BookOpen, Headphones, Brain, Lightbulb, ChevronRight, BookMarked } from 'lucide-react';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { useActiveTests, TestInfo } from '@/hooks/useTests';
import { Loader2 } from 'lucide-react';

interface SkillSelectionProps {
  level: CEFRLevel;
  onSelectMock: (skill: SkillType, mockId: number, testId?: string) => void;
  onBack: () => void;
}

const BOOK_NAMES = [
  "1-Kitob",
  "2-Kitob",
  "3-Kitob",
  "4-Kitob",
  "5-Kitob",
  "6-Kitob",
];

export const SkillSelection = ({ level, onSelectMock, onBack }: SkillSelectionProps) => {
  const { readingTests, listeningTests, vocabularyTests, grammarTests, loading } = useActiveTests(level);
  const [selectedVocabBook, setSelectedVocabBook] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SkillType>('vocabulary');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group vocabulary tests by book
  const getVocabBookUnits = (bookNumber: number) => {
    return vocabularyTests
      .filter(t => t.bookNumber === bookNumber)
      .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));
  };

  // Group grammar tests by unit
  const grammarUnits = grammarTests
    .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));

  const tabs = [
    { key: 'vocabulary' as SkillType, label: "Lug'at", icon: Lightbulb, color: 'purple' },
    { key: 'grammar' as SkillType, label: 'Grammatika', icon: Brain, color: 'orange' },
    { key: 'reading' as SkillType, label: 'Reading', icon: BookOpen, color: 'emerald' },
    { key: 'listening' as SkillType, label: 'Listening', icon: Headphones, color: 'blue' },
  ];

  const renderUnitList = (tests: TestInfo[], skill: SkillType) => {
    if (tests.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Hali testlar qo'shilmagan</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tests.map((test, index) => (
          <button
            key={test.id}
            onClick={() => onSelectMock(skill, index + 1, test.id)}
            className="mock-grid-item hover:border-primary hover:bg-primary/5 text-left p-4"
          >
            <div className="font-semibold text-sm">Unit {test.unitNumber || index + 1}</div>
            <div className="text-xs text-muted-foreground mt-1">{test.questionCount} ta savol</div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 animate-fade-in">
      <div className="container mx-auto px-4">
        <button
          onClick={selectedVocabBook ? () => setSelectedVocabBook(null) : onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          {selectedVocabBook ? "Kitoblarga Qaytish" : "Darajalarga Qaytish"}
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <span className="font-bold">{level}</span>
            <span>Daraja</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Test Turini <span className="text-gradient">Tanlang</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedVocabBook(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          {activeTab === 'vocabulary' && !selectedVocabBook && (
            <div>
              <h2 className="text-xl font-display font-bold mb-6 text-center">Kitobni Tanlang</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BOOK_NAMES.map((name, i) => {
                  const bookNum = i + 1;
                  const unitCount = getVocabBookUnits(bookNum).length;
                  return (
                    <button
                      key={bookNum}
                      onClick={() => setSelectedVocabBook(bookNum)}
                      className="card-elevated flex flex-col items-center gap-3 p-6 hover:border-primary cursor-pointer"
                    >
                      <BookMarked className="w-10 h-10 text-primary" />
                      <div className="font-display font-bold text-lg">{name}</div>
                      <div className="text-sm text-muted-foreground">
                        {unitCount > 0 ? `${unitCount} ta unit` : "Hali bo'sh"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'vocabulary' && selectedVocabBook && (
            <div>
              <h2 className="text-xl font-display font-bold mb-6 text-center">
                {BOOK_NAMES[selectedVocabBook - 1]} — Unitlar
              </h2>
              {renderUnitList(getVocabBookUnits(selectedVocabBook), 'vocabulary')}
            </div>
          )}

          {activeTab === 'grammar' && (
            <div>
              <h2 className="text-xl font-display font-bold mb-6 text-center">Grammatika Unitlari</h2>
              {renderUnitList(grammarUnits, 'grammar')}
            </div>
          )}

          {activeTab === 'reading' && (
            <div>
              <h2 className="text-xl font-display font-bold mb-6 text-center">Reading Testlari</h2>
              {readingTests.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {readingTests.map((test, index) => (
                    <button
                      key={test.id}
                      onClick={() => onSelectMock('reading', index + 1, test.id)}
                      className="mock-grid-item hover:border-primary text-left p-4"
                    >
                      <div className="font-medium">{test.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.questionCount} ta savol • {Math.floor(test.timeLimit / 60)} daqiqa
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Hali reading testlari qo'shilmagan</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'listening' && (
            <div>
              <h2 className="text-xl font-display font-bold mb-6 text-center">Listening Testlari</h2>
              {listeningTests.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {listeningTests.map((test, index) => (
                    <button
                      key={test.id}
                      onClick={() => onSelectMock('listening', index + 1, test.id)}
                      className="mock-grid-item hover:border-primary text-left p-4"
                    >
                      <div className="font-medium">{test.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.questionCount} ta savol • {Math.floor(test.timeLimit / 60)} daqiqa
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Hali listening testlari qo'shilmagan</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
