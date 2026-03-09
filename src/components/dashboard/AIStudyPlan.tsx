import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Target, Clock, BookOpen, TrendingUp, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TestResult {
  skill: string;
  level: string;
  percentage: number;
  created_at: string;
}

interface StudyPlanData {
  currentLevel: string;
  targetLevel: string;
  weakSkills: { skill: string; score: number; priority: 'high' | 'medium' | 'low' }[];
  weeklyPlan: { day: string; focus: string; duration: string; activities: string[] }[];
  tips: string[];
  estimatedWeeks: number;
}

export const AIStudyPlan = ({ results }: { results: TestResult[] }) => {
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (results.length < 2) {
      toast.info("Kamida 2 ta test ishlang, so'ng AI reja tuzadi");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-study-plan', {
        body: { results: results.slice(0, 50) },
      });
      if (error) throw error;
      if (data?.plan) setPlan(data.plan);
    } catch (err: any) {
      toast.error(err.message || "AI reja tuzishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          AI Shaxsiy O'quv Reja
          <Badge variant="secondary" className="text-[10px] ml-auto">AI</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  AI natijalaringizni tahlil qilib, shaxsiy haftalik o'quv rejasi tuzadi
                </p>
                <Button onClick={generatePlan} disabled={loading || results.length < 2} size="lg">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reja tuzilmoqda...</>
                  ) : (
                    <><Brain className="w-4 h-4 mr-2" />AI Reja Tuzish</>
                  )}
                </Button>
                {results.length < 2 && (
                  <p className="text-xs text-muted-foreground mt-2">Kamida 2 ta test ishlang</p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Header stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-display font-bold">{plan.currentLevel} → {plan.targetLevel}</p>
                  <p className="text-[10px] text-muted-foreground">Maqsad</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-display font-bold">~{plan.estimatedWeeks}</p>
                  <p className="text-[10px] text-muted-foreground">Hafta</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                  <p className="text-lg font-display font-bold">{plan.weakSkills.length}</p>
                  <p className="text-[10px] text-muted-foreground">Zaif ko'nikma</p>
                </div>
              </div>

              {/* Weak skills */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Zaif ko'nikmalar
                </h4>
                <div className="flex flex-wrap gap-2">
                  {plan.weakSkills.map((s, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${priorityColors[s.priority]}`}>
                      {s.skill} ({s.score}%)
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly plan */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Haftalik reja</h4>
                <div className="space-y-2">
                  {plan.weeklyPlan.map((day, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="w-10 text-center shrink-0">
                        <p className="text-xs font-bold text-primary">{day.day}</p>
                        <p className="text-[10px] text-muted-foreground">{day.duration}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">{day.focus}</p>
                        <div className="flex flex-wrap gap-1">
                          {day.activities.map((a, j) => (
                            <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{a}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-primary/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-2">AI tavsiyalari</h4>
                <ul className="space-y-1.5">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" size="sm" onClick={() => setPlan(null)} className="w-full">
                Qayta tuzish
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
