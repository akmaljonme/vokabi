import { ArrowLeft, BookOpen, Headphones } from 'lucide-react';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { useActiveTests, TestInfo } from '@/hooks/useTests';
import { Loader2 } from 'lucide-react';

interface SkillSelectionProps {
  level: CEFRLevel;
  onSelectMock: (skill: SkillType, mockId: number, testId?: string) => void;
  onBack: () => void;
}

export const SkillSelection = ({ level, onSelectMock, onBack }: SkillSelectionProps) => {
  const { readingTests, listeningTests, loading, error } = useActiveTests(level);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 animate-fade-in">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Levels
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <span className="font-bold">{level}</span>
            <span>Level</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Choose Your <span className="text-gradient">Skill</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Select Reading or Listening, then choose a mock test
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Reading Section */}
          <div className="skill-card bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-emerald-700">Reading</h2>
                <p className="text-emerald-600/70">Test your comprehension skills</p>
              </div>
            </div>

            {readingTests.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-2">
                  {readingTests.map((test, index) => (
                    <button
                      key={test.id}
                      onClick={() => onSelectMock('reading', index + 1, test.id)}
                      className="mock-grid-item hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-700 text-left p-3"
                    >
                      <div className="font-medium">{test.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.questionCount} ta savol • {Math.floor(test.timeLimit / 60)} daqiqa
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {readingTests.length} ta test mavjud
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Hali reading testlari qo'shilmagan</p>
              </div>
            )}
          </div>

          {/* Listening Section */}
          <div className="skill-card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-blue-700">Listening</h2>
                <p className="text-blue-600/70">Practice your listening ability</p>
              </div>
            </div>

            {listeningTests.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-2">
                  {listeningTests.map((test, index) => (
                    <button
                      key={test.id}
                      onClick={() => onSelectMock('listening', index + 1, test.id)}
                      className="mock-grid-item hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 text-left p-3"
                    >
                      <div className="font-medium">{test.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.questionCount} ta savol • {Math.floor(test.timeLimit / 60)} daqiqa
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {listeningTests.length} ta test mavjud
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Headphones className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Hali listening testlari qo'shilmagan</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        {(readingTests.length > 0 || listeningTests.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="card-elevated text-center">
              <div className="text-3xl font-display font-bold text-primary mb-2">
                {readingTests.length + listeningTests.length}
              </div>
              <p className="text-muted-foreground">Jami testlar</p>
            </div>
            <div className="card-elevated text-center">
              <div className="text-3xl font-display font-bold text-primary mb-2">
                {readingTests.reduce((sum, t) => sum + t.questionCount, 0) + listeningTests.reduce((sum, t) => sum + t.questionCount, 0)}
              </div>
              <p className="text-muted-foreground">Jami savollar</p>
            </div>
            <div className="card-elevated text-center">
              <div className="text-3xl font-display font-bold text-primary mb-2">{level}</div>
              <p className="text-muted-foreground">CEFR daraja</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
