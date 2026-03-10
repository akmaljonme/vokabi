import { motion } from 'framer-motion';
import { Brain, PenTool, Mic, Star, BookOpen, MessageSquare, CheckCircle2, ArrowLeft, RotateCcw, Clock } from 'lucide-react';
import { TestResult, AIWritingResult, AISpeakingResult } from '@/types/cefr';
import { Progress } from '@/components/ui/progress';
import { VideoRecommendations } from '@/components/AIResultsSection';
import { useSubscription } from '@/hooks/useSubscription';

interface AIResultDisplayProps {
  result: TestResult;
  onRetry: () => void;
  onBack: () => void;
}

const ScoreCircle = ({ score, max = 9, delay = 0 }: { score: number; max?: number; delay?: number }) => {
  const percentage = (score / max) * 100;
  const getColor = () => {
    if (percentage >= 78) return 'text-emerald-500';
    if (percentage >= 56) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center"
    >
      <div className={`text-4xl font-display font-bold ${getColor()}`}>{score}</div>
      <div className="text-xs text-muted-foreground">/ {max}</div>
    </motion.div>
  );
};

const CriteriaCard = ({ title, score, feedback, icon: Icon, delay }: {
  title: string; score: number; feedback: string; icon: any; delay: number;
}) => {
  const percentage = (score / 9) * 100;
  const getBarColor = () => {
    if (percentage >= 78) return 'bg-emerald-500';
    if (percentage >= 56) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-elevated p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <span className="text-lg font-display font-bold">{score}/9</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className={`h-full rounded-full ${getBarColor()}`}
        />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>
    </motion.div>
  );
};

export const AIResultDisplay = ({ result, onRetry, onBack }: AIResultDisplayProps) => {
  const { isPro } = useSubscription();
  const isWriting = result.skill === 'writing';
  const aiResult = result.aiResult;

  if (!aiResult) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Testlarga qaytish
          </motion.button>
          <div className="max-w-md mx-auto py-20">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">AI natijasi mavjud emas</h2>
            <p className="text-muted-foreground mb-6">AI baholash amalga oshirilmadi yoki xatolik yuz berdi.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={onRetry} className="btn-primary flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4" /> Qayta ishlash
              </button>
              <button onClick={onBack} className="btn-outline text-sm">Boshqa test</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const overallBand = aiResult.overallBand;
  const bandPercentage = (overallBand / 9) * 100;
  const passed = overallBand >= 5;

  const writingCriteria = isWriting ? (aiResult as AIWritingResult).criteria : null;
  const speakingCriteria = !isWriting ? (aiResult as AISpeakingResult).criteria : null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Testlarga qaytish
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 ${
              passed ? 'bg-emerald-500/10' : 'bg-amber-500/10'
            }`}
          >
            {isWriting ? (
              <PenTool className={`w-10 h-10 ${passed ? 'text-emerald-500' : 'text-amber-500'}`} />
            ) : (
              <Mic className={`w-10 h-10 ${passed ? 'text-emerald-500' : 'text-amber-500'}`} />
            )}
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 tracking-tight">
            AI Baholash Natijasi
          </h1>
          <p className="text-muted-foreground">
            {result.level} • {isWriting ? 'Writing' : 'Speaking'} • AI tomonidan baholandi
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-sm mx-auto mb-10 card-elevated p-8 text-center"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Umumiy Ball</p>
          <ScoreCircle score={overallBand} delay={0.4} />
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bandPercentage}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTime(result.timeTaken)}
          </div>
        </motion.div>

        {/* Criteria */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-lg font-display font-bold mb-4 text-center">Batafsil Baholash</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {isWriting && writingCriteria && (
              <>
                <CriteriaCard title="Task Achievement" score={writingCriteria.taskAchievement.score} feedback={writingCriteria.taskAchievement.feedback} icon={CheckCircle2} delay={0.5} />
                <CriteriaCard title="Coherence & Cohesion" score={writingCriteria.coherenceAndCohesion.score} feedback={writingCriteria.coherenceAndCohesion.feedback} icon={MessageSquare} delay={0.6} />
                <CriteriaCard title="Lexical Resource" score={writingCriteria.lexicalResource.score} feedback={writingCriteria.lexicalResource.feedback} icon={BookOpen} delay={0.7} />
                <CriteriaCard title="Grammatical Range" score={writingCriteria.grammaticalRange.score} feedback={writingCriteria.grammaticalRange.feedback} icon={PenTool} delay={0.8} />
              </>
            )}
            {!isWriting && speakingCriteria && (
              <>
                <CriteriaCard title="Fluency & Coherence" score={speakingCriteria.fluencyAndCoherence.score} feedback={speakingCriteria.fluencyAndCoherence.feedback} icon={MessageSquare} delay={0.5} />
                <CriteriaCard title="Lexical Resource" score={speakingCriteria.lexicalResource.score} feedback={speakingCriteria.lexicalResource.feedback} icon={BookOpen} delay={0.6} />
                <CriteriaCard title="Grammatical Range" score={speakingCriteria.grammaticalRange.score} feedback={speakingCriteria.grammaticalRange.feedback} icon={PenTool} delay={0.7} />
                <CriteriaCard title="Pronunciation" score={speakingCriteria.pronunciation.score} feedback={speakingCriteria.pronunciation.feedback} icon={Mic} delay={0.8} />
              </>
            )}
          </div>
        </div>

        {/* Overall Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="max-w-2xl mx-auto mb-10 card-elevated p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold">Umumiy Fikr</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {aiResult.overallFeedback}
          </p>
        </motion.div>

        {/* Corrected Essay / Suggested Response */}
        {(isWriting ? (aiResult as AIWritingResult).correctedEssay : (aiResult as AISpeakingResult).suggestedResponse) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="max-w-2xl mx-auto mb-10 card-elevated p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold">
                {isWriting ? 'Tuzatilgan Versiya' : 'Tavsiya Etilgan Javob'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {isWriting ? (aiResult as AIWritingResult).correctedEssay : (aiResult as AISpeakingResult).suggestedResponse}
            </p>
          </motion.div>
        )}

        {/* User's Answers */}
        {result.answers.length > 0 && result.answers.some(a => a.userAnswer && a.userAnswer !== '[Audio]') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="max-w-2xl mx-auto mb-10 card-elevated p-6"
          >
            <h3 className="font-display font-bold mb-3">Sizning Javoblaringiz</h3>
            <div className="space-y-4">
              {result.answers.map((a, i) => (
                <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isWriting ? `Task ${i + 1}` : `Savol ${i + 1}`}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {typeof a.userAnswer === 'string' ? a.userAnswer : Array.isArray(a.userAnswer) ? a.userAnswer.join(', ') : ''}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Video Recommendations */}
        {isPro && aiResult && aiResult.overallBand < 9 && (() => {
          // Build pseudo "wrong questions" from weak criteria for video recommendations
          const weakQuestions: { question: string; correct: string; userAnswer: string }[] = [];
          if (isWriting && writingCriteria) {
            if (writingCriteria.taskAchievement.score < 7) weakQuestions.push({ question: `Task Achievement: ${writingCriteria.taskAchievement.feedback}`, correct: 'Band 7+', userAnswer: `Band ${writingCriteria.taskAchievement.score}` });
            if (writingCriteria.coherenceAndCohesion.score < 7) weakQuestions.push({ question: `Coherence & Cohesion: ${writingCriteria.coherenceAndCohesion.feedback}`, correct: 'Band 7+', userAnswer: `Band ${writingCriteria.coherenceAndCohesion.score}` });
            if (writingCriteria.lexicalResource.score < 7) weakQuestions.push({ question: `Lexical Resource: ${writingCriteria.lexicalResource.feedback}`, correct: 'Band 7+', userAnswer: `Band ${writingCriteria.lexicalResource.score}` });
            if (writingCriteria.grammaticalRange.score < 7) weakQuestions.push({ question: `Grammatical Range: ${writingCriteria.grammaticalRange.feedback}`, correct: 'Band 7+', userAnswer: `Band ${writingCriteria.grammaticalRange.score}` });
          }
          if (!isWriting && speakingCriteria) {
            if (speakingCriteria.fluencyAndCoherence.score < 7) weakQuestions.push({ question: `Fluency & Coherence: ${speakingCriteria.fluencyAndCoherence.feedback}`, correct: 'Band 7+', userAnswer: `Band ${speakingCriteria.fluencyAndCoherence.score}` });
            if (speakingCriteria.lexicalResource.score < 7) weakQuestions.push({ question: `Lexical Resource: ${speakingCriteria.lexicalResource.feedback}`, correct: 'Band 7+', userAnswer: `Band ${speakingCriteria.lexicalResource.score}` });
            if (speakingCriteria.grammaticalRange.score < 7) weakQuestions.push({ question: `Grammatical Range: ${speakingCriteria.grammaticalRange.feedback}`, correct: 'Band 7+', userAnswer: `Band ${speakingCriteria.grammaticalRange.score}` });
            if (speakingCriteria.pronunciation.score < 7) weakQuestions.push({ question: `Pronunciation: ${speakingCriteria.pronunciation.feedback}`, correct: 'Band 7+', userAnswer: `Band ${speakingCriteria.pronunciation.score}` });
          }
          if (weakQuestions.length === 0) return null;
          return (
            <div className="max-w-2xl mx-auto mb-10">
              <VideoRecommendations wrongQuestions={weakQuestions} level={result.level} skill={result.skill} />
            </div>
          );
        })()}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          <button onClick={onRetry} className="btn-primary flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Qayta ishlash
          </button>
          <button onClick={onBack} className="btn-outline text-sm">Boshqa test</button>
        </motion.div>
      </div>
    </div>
  );
};
