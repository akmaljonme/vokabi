import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, ExternalLink, Video, Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoSuggestion {
  weakTopics: string[];
  videos: { title: string; channel: string; url: string; description: string; topic: string }[];
  overallAdvice: string;
}

interface WritingEvaluation {
  overallBand: number;
  criteria: {
    taskAchievement: { score: number; feedback: string };
    coherenceAndCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
  };
  overallFeedback: string;
  correctedEssay: string;
}

interface SpeakingEvaluation {
  overallBand: number;
  criteria: {
    fluencyAndCoherence: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    pronunciation: { score: number; feedback: string };
  };
  overallFeedback: string;
  suggestedResponse: string;
}

interface WrongQuestion {
  question: string;
  correct: string | string[];
  userAnswer: string | string[];
}

interface VideoRecommendationsProps {
  wrongQuestions: WrongQuestion[];
  level: string;
  skill: string;
}

export const VideoRecommendations = ({ wrongQuestions, level, skill }: VideoRecommendationsProps) => {
  const [videoSuggestions, setVideoSuggestions] = useState<VideoSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRecommendations = async () => {
    if (wrongQuestions.length === 0) { toast.info("Barcha javoblar to'g'ri!"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-videos', {
        body: { wrongQuestions, level, skill },
      });
      if (error) throw error;
      if (data?.result) setVideoSuggestions(data.result);
    } catch (err: any) {
      toast.error(err.message || "Video tavsiyalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (wrongQuestions.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {!videoSuggestions ? (
          <Button onClick={loadRecommendations} disabled={loading} className="w-full" variant="secondary">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Video darslar qidirilmoqda...</>
            ) : (
              <><Video className="w-4 h-4 mr-2" />Xatolar bo'yicha video darslar tavsiyasi</>
            )}
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Tavsiya etilgan video darslar</h3>
            </div>

            {videoSuggestions.weakTopics.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {videoSuggestions.weakTopics.map((topic, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">{topic}</Badge>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {videoSuggestions.videos.map((video, i) => (
                <a key={i} href={video.url} target="_blank" rel="noopener noreferrer"
                  className="block p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        {video.title}
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100" />
                      </h4>
                      <p className="text-xs text-primary/80 mt-0.5">{video.channel}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{video.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{video.topic}</Badge>
                        <span className="text-[10px] text-muted-foreground/60">YouTube'da ko'rish →</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{videoSuggestions.overallAdvice}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface WritingEvalCardProps {
  questionId: string;
  questionText: string;
  essay: string;
  level: string;
  index: number;
}

export const WritingEvalCard = ({ questionId, questionText, essay, level, index }: WritingEvalCardProps) => {
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  const [loading, setLoading] = useState(false);

  const checkWithAI = async () => {
    if (!essay?.trim()) { toast.error("Avval javob yozing"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-writing', {
        body: { essay, question: questionText, level },
      });
      if (error) throw error;
      if (data?.result) { setEvaluation(data.result); toast.success("AI baholash tayyor!"); }
    } catch (err: any) {
      toast.error(err.message || "AI tekshirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Badge variant="secondary">{index + 1}-savol</Badge>
          <p className="font-medium mt-2">{questionText}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm whitespace-pre-wrap">{essay || '— Javob berilmagan —'}</p>
        </div>

        {!evaluation && (
          <Button onClick={checkWithAI} disabled={loading || !essay?.trim()} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI tekshirmoqda...</>
            ) : (
              <><Star className="w-4 h-4 mr-2" />AI bilan tekshirish</>
            )}
          </Button>
        )}

        {evaluation && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-primary">{evaluation.overallBand}/9</div>
              <span className="text-sm text-muted-foreground">Umumiy baho</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'taskAchievement', label: 'Task Achievement' },
                { key: 'coherenceAndCohesion', label: 'Coherence & Cohesion' },
                { key: 'lexicalResource', label: 'Lexical Resource' },
                { key: 'grammaticalRange', label: 'Grammar' },
              ].map(({ key, label }) => {
                const c = evaluation.criteria[key as keyof typeof evaluation.criteria];
                return (
                  <div key={key} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{label}</span>
                      <Badge variant="outline">{c.score}/9</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.feedback}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />Umumiy tavsiya
              </h4>
              <p className="text-sm text-muted-foreground">{evaluation.overallFeedback}</p>
            </div>
            {evaluation.correctedEssay && (
              <details className="bg-muted/30 rounded-lg p-4">
                <summary className="text-sm font-medium cursor-pointer">To'g'rilangan versiya</summary>
                <p className="text-sm mt-2 whitespace-pre-wrap">{evaluation.correctedEssay}</p>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface SpeakingEvalCardProps {
  questionId: string;
  questionText: string;
  transcript: string;
  level: string;
  index: number;
  audioBlob?: Blob;
}

export const SpeakingEvalCard = ({ questionId, questionText, transcript, level, index, audioBlob }: SpeakingEvalCardProps) => {
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [loading, setLoading] = useState(false);

  const checkWithAI = async () => {
    if (!transcript?.trim()) { toast.error("Avval gapiring yoki transkript kiriting"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-speaking', {
        body: { transcript, question: questionText, level },
      });
      if (error) throw error;
      if (data?.result) { setEvaluation(data.result); toast.success("AI baholash tayyor!"); }
    } catch (err: any) {
      toast.error(err.message || "AI tekshirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Badge variant="secondary">{index + 1}-savol</Badge>
        <p className="font-medium">{questionText}</p>

        {transcript && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Sizning javobingiz:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {audioBlob && <audio controls className="w-full" src={URL.createObjectURL(audioBlob)} />}

        {!evaluation && (
          <Button onClick={checkWithAI} disabled={loading || !transcript?.trim()} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI tekshirmoqda...</>
            ) : (
              <><Star className="w-4 h-4 mr-2" />AI bilan baholash</>
            )}
          </Button>
        )}

        {evaluation && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-primary">{evaluation.overallBand}/9</div>
              <span className="text-sm text-muted-foreground">Umumiy baho</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'fluencyAndCoherence', label: 'Fluency & Coherence' },
                { key: 'lexicalResource', label: 'Lexical Resource' },
                { key: 'grammaticalRange', label: 'Grammar' },
                { key: 'pronunciation', label: 'Pronunciation' },
              ].map(({ key, label }) => {
                const c = evaluation.criteria[key as keyof typeof evaluation.criteria];
                return (
                  <div key={key} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{label}</span>
                      <Badge variant="outline">{c.score}/9</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.feedback}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Umumiy tavsiya</h4>
              <p className="text-sm text-muted-foreground">{evaluation.overallFeedback}</p>
            </div>
            {evaluation.suggestedResponse && (
              <details className="bg-muted/30 rounded-lg p-4">
                <summary className="text-sm font-medium cursor-pointer">Namuna javob</summary>
                <p className="text-sm mt-2 whitespace-pre-wrap">{evaluation.suggestedResponse}</p>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
