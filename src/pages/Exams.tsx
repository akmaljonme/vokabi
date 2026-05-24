import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ClipboardList,
  Clock,
  Target,
  ArrowLeft,
  Lock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { ExamInterface } from "@/components/ExamInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  skill: string;
  level: string;
  time_limit: number;
  max_attempts: number;
  is_active: boolean;
  access_code: string | null;
  question_count?: number;
  attempts_used?: number;
}

const Exams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ExamData | null>(null);
  const [codeDialogExam, setCodeDialogExam] = useState<ExamData | null>(null);
  const [enteredCode, setEnteredCode] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    if (!user) return;
    try {
      const { data: examData } = await (supabase
        .from("exams" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }) as any);

      const enriched = await Promise.all(
        ((examData || []) as ExamData[]).map(async (exam) => {
          const { count: qCount } = await (supabase
            .from("exam_questions" as any)
            .select("*", { count: "exact", head: true })
            .eq("exam_id", exam.id) as any);
          const { count: aCount } = await (supabase
            .from("exam_attempts" as any)
            .select("*", { count: "exact", head: true })
            .eq("exam_id", exam.id)
            .eq("user_id", user.id) as any);
          return {
            ...exam,
            question_count: qCount || 0,
            attempts_used: aCount || 0,
          };
        }),
      );

      setExams(enriched);
    } catch (e) {
      console.error(e);
      toast.error("Examlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (exam: ExamData) => {
    if ((exam.attempts_used || 0) >= exam.max_attempts) {
      toast.error("Urinishlar tugadi");
      return;
    }
    if ((exam.question_count || 0) === 0) {
      toast.error("Bu examda savollar yo'q");
      return;
    }
    setCodeDialogExam(exam);
    setEnteredCode("");
  };

  const verifyCode = () => {
    if (!codeDialogExam) return;
    if (
      enteredCode.trim().toUpperCase() ===
      (codeDialogExam.access_code || "").toUpperCase()
    ) {
      setActiveExam(codeDialogExam);
      setCodeDialogExam(null);
      setEnteredCode("");
    } else {
      toast.error("Kod noto'g'ri!");
    }
  };

  if (activeExam) {
    return (
      <ExamInterface
        exam={activeExam}
        onFinish={() => {
          setActiveExam(null);
          fetchExams();
        }}
        onBack={() => setActiveExam(null)}
      />
    );
  }

  const skillColors: Record<string, string> = {
    reading: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    listening: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    grammar: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  const skillEmoji: Record<string, string> = {
    reading: "📖",
    listening: "🎧",
    grammar: "📝",
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Examlar</h1>
            <p className="text-muted-foreground text-sm">
              Examga kirish uchun o'qituvchingiz bergan kodni kiriting
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : exams.length === 0 ? (
          <Card className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Examlar topilmadi</h3>
            <p className="text-muted-foreground text-sm">
              Hozircha faol examlar yo'q
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => {
              const attemptsLeft =
                exam.max_attempts - (exam.attempts_used || 0);
              const canAttempt = attemptsLeft > 0;

              return (
                <Card
                  key={exam.id}
                  className="p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xl">
                          {skillEmoji[exam.skill] || "📋"}
                        </span>
                        <h3 className="font-semibold">{exam.title}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${skillColors[exam.skill] || ""}`}
                        >
                          {exam.skill}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {exam.level}
                        </Badge>
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {exam.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />{" "}
                          {exam.time_limit / 60} daqiqa
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />{" "}
                          {exam.question_count} savol
                        </span>
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          {attemptsLeft}/{exam.max_attempts} urinish qoldi
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExamClick(exam)}
                      disabled={!canAttempt}
                      className="shrink-0"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      {canAttempt ? "Kirish" : "Tugagan"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />

      {/* Access Code Dialog */}
      <Dialog
        open={!!codeDialogExam}
        onOpenChange={(open) => {
          if (!open) setCodeDialogExam(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Kirish kodini kiriting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{codeDialogExam?.title}</strong> examiga kirish uchun
              o'qituvchingiz bergan kodni kiriting.
            </p>
            <Input
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
              placeholder="Masalan: ABC123"
              className="font-mono text-center text-lg tracking-[0.3em]"
              maxLength={8}
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyCode();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialogExam(null)}>
              Bekor
            </Button>
            <Button onClick={verifyCode} disabled={!enteredCode.trim()}>
              Kirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Exams;
