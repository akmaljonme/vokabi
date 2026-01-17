import { ArrowLeft, BookOpen, Headphones } from 'lucide-react';
import { CEFRLevel, SkillType } from '@/types/cefr';

interface SkillSelectionProps {
  level: CEFRLevel;
  onSelectMock: (skill: SkillType, mockId: number) => void;
  onBack: () => void;
}

export const SkillSelection = ({ level, onSelectMock, onBack }: SkillSelectionProps) => {
  const mocks = Array.from({ length: 20 }, (_, i) => i + 1);

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

            <div className="grid grid-cols-5 gap-2">
              {mocks.map((mockId) => (
                <button
                  key={`reading-${mockId}`}
                  onClick={() => onSelectMock('reading', mockId)}
                  className="mock-grid-item hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {mockId}
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              20 mock tests • 4 parts each • 40 questions
            </p>
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

            <div className="grid grid-cols-5 gap-2">
              {mocks.map((mockId) => (
                <button
                  key={`listening-${mockId}`}
                  onClick={() => onSelectMock('listening', mockId)}
                  className="mock-grid-item hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700"
                >
                  {mockId}
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              20 mock tests • Audio included • Real exam format
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="card-elevated text-center">
            <div className="text-3xl font-display font-bold text-primary mb-2">30 min</div>
            <p className="text-muted-foreground">Time per test</p>
          </div>
          <div className="card-elevated text-center">
            <div className="text-3xl font-display font-bold text-primary mb-2">40</div>
            <p className="text-muted-foreground">Questions per test</p>
          </div>
          <div className="card-elevated text-center">
            <div className="text-3xl font-display font-bold text-primary mb-2">4</div>
            <p className="text-muted-foreground">Parts per test</p>
          </div>
        </div>
      </div>
    </div>
  );
};
