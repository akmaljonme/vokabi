import { ArrowLeft } from 'lucide-react';
import { CEFRLevel } from '@/types/cefr';
import { levels } from '@/data/mockData';

interface LevelSelectionProps {
  onSelectLevel: (level: CEFRLevel) => void;
  onBack: () => void;
}

export const LevelSelection = ({ onSelectLevel, onBack }: LevelSelectionProps) => {
  const levelColors: Record<CEFRLevel, string> = {
    A1: 'from-emerald-400 to-emerald-600',
    A2: 'from-teal-400 to-teal-600',
    B1: 'from-amber-400 to-amber-600',
    B2: 'from-orange-400 to-orange-600',
    C1: 'from-red-400 to-red-600',
  };

  const levelBorderColors: Record<CEFRLevel, string> = {
    A1: 'hover:border-emerald-400',
    A2: 'hover:border-teal-400',
    B1: 'hover:border-amber-400',
    B2: 'hover:border-orange-400',
    C1: 'hover:border-red-400',
  };

  return (
    <div className="min-h-screen bg-background py-8 lg:py-16 animate-fade-in">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Select Your <span className="text-gradient">Level</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the CEFR level that matches your current English proficiency
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {levels.map((level, index) => (
            <button
              key={level.level}
              onClick={() => onSelectLevel(level.level)}
              className={`group relative overflow-hidden rounded-3xl border-2 border-border ${levelBorderColors[level.level]} transition-all duration-300 hover:scale-105 hover:shadow-xl bg-card p-8 text-center animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${levelColors[level.level]} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              {/* Level Badge */}
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${levelColors[level.level]} text-white text-3xl font-display font-bold mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                {level.level}
              </div>
              
              <h3 className="text-xl font-display font-semibold mb-2">{level.name}</h3>
              <p className="text-sm text-muted-foreground">{level.description}</p>
              
              {/* Hover Indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${levelColors[level.level]} transform scale-x-0 group-hover:scale-x-100 transition-transform`} />
            </button>
          ))}
        </div>

        {/* Level Descriptions */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold mb-8 text-center">Level Descriptions</h2>
          <div className="grid gap-4">
            {[
              { level: 'A1', desc: 'Can understand and use familiar everyday expressions and very basic phrases.' },
              { level: 'A2', desc: 'Can communicate in simple and routine tasks requiring simple and direct exchange of information.' },
              { level: 'B1', desc: 'Can deal with most situations likely to arise while traveling in an area where the language is spoken.' },
              { level: 'B2', desc: 'Can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible.' },
              { level: 'C1', desc: 'Can express ideas fluently and spontaneously without much obvious searching for expressions.' },
            ].map((item) => (
              <div key={item.level} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <span className={`px-3 py-1 rounded-lg bg-gradient-to-br ${levelColors[item.level as CEFRLevel]} text-white font-bold text-sm`}>
                  {item.level}
                </span>
                <p className="text-muted-foreground flex-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
