import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Clock,
  Award,
  BookOpen,
  Headphones,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Flame,
  Zap,
  Trophy,
  Star,
  Crown,
  Medal,
  Search,
  Bell,
  Bot,
  Gift,
  Lock,
  ChevronRight,
  Mic,
  PenTool,
} from "lucide-react";
import { CEFRLevel } from "@/types/cefr";
import { Header } from "@/components/Header";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useGamification } from "@/hooks/useGamification";
import { AchievementToast } from "@/components/AchievementToast";
import { StudyHeatmap } from "@/components/dashboard/StudyHeatmap";
import { Tilt3D } from "@/components/Tilt3D";
import { AIStudyPlan } from "@/components/dashboard/AIStudyPlan";
import { DailyChallenges } from "@/components/dashboard/DailyChallenges";
import { ReferralWidget } from "@/components/ReferralWidget";
import { VideoRecommendations } from "@/components/dashboard/VideoRecommendations";

interface TestResult {
  id: string;
  skill: string;
  level: string;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  time_taken: number;
  created_at: string;
}

interface SkillAnalysis {
  skill: string;
  averageScore: number;
  totalTests: number;
  trend: "up" | "down" | "stable";
  recentPerformance: number[];
}

interface LevelAnalysis {
  level: string;
  averageScore: number;
  testsCompleted: number;
  recommended: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(173 80% 40%)",
  "hsl(142 76% 36%)",
  "hsl(45 93% 47%)",
  "hsl(25 95% 53%)",
  "hsl(270 60% 55%)",
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    progress,
    achievements,
    userAchievements,
    leaderboard,
    newAchievement,
    dismissAchievement,
    xpProgress,
    xpToNextLevel,
    userRank,
    loading: gamLoading,
  } = useGamification();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setResults((data || []) as unknown as TestResult[]);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressOverTime = () => {
    const sortedResults = [...results].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return sortedResults.slice(-10).map((result, index) => ({
      test: index + 1,
      score: result.percentage,
      date: new Date(result.created_at).toLocaleDateString(),
      skill: result.skill,
      level: result.level,
    }));
  };

  const getSkillAnalysis = (): SkillAnalysis[] => {
    const skills = [
      "reading",
      "listening",
      "vocabulary",
      "grammar",
      "writing",
      "speaking",
    ];
    return skills.map((skill) => {
      const skillResults = results.filter((r) => r.skill === skill);
      const averageScore =
        skillResults.length > 0
          ? skillResults.reduce((sum, r) => sum + r.percentage, 0) /
            skillResults.length
          : 0;
      const recentResults = skillResults.slice(0, 5).map((r) => r.percentage);
      const trend =
        recentResults.length >= 2
          ? recentResults[0] > recentResults[recentResults.length - 1]
            ? "up"
            : recentResults[0] < recentResults[recentResults.length - 1]
              ? "down"
              : "stable"
          : "stable";
      return {
        skill,
        averageScore: Math.round(averageScore),
        totalTests: skillResults.length,
        trend,
        recentPerformance: recentResults.reverse(),
      };
    });
  };

  const getLevelAnalysis = (): LevelAnalysis[] => {
    const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
    return levels.map((level) => {
      const levelResults = results.filter((r) => r.level === level);
      const averageScore =
        levelResults.length > 0
          ? levelResults.reduce((sum, r) => sum + r.percentage, 0) /
            levelResults.length
          : 0;
      return {
        level,
        averageScore: Math.round(averageScore),
        testsCompleted: levelResults.length,
        recommended: averageScore >= 70 && levelResults.length >= 2,
      };
    });
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    const skillAnalysis = getSkillAnalysis();
    const levelAnalysis = getLevelAnalysis();
    skillAnalysis.forEach((skill) => {
      if (skill.averageScore < 50 && skill.totalTests > 0)
        recommendations.push(
          `${skill.skill} ko'nikmangizga e'tibor bering — o'rtacha ${skill.averageScore}%`,
        );
      if (skill.trend === "down" && skill.totalTests >= 3)
        recommendations.push(
          `${skill.skill} natijalaringiz pasaymoqda. Asosiy mavzularni takrorlang.`,
        );
    });
    const highestPassingLevel = levelAnalysis.filter(
      (l) => l.averageScore >= 60 && l.testsCompleted > 0,
    );
    if (highestPassingLevel.length > 0) {
      const highest = highestPassingLevel[highestPassingLevel.length - 1];
      const allLevels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
      const nextIndex = allLevels.indexOf(highest.level as CEFRLevel) + 1;
      if (nextIndex < 5)
        recommendations.push(
          `${allLevels[nextIndex]} darajasini sinab ko'ring — ${highest.level}da yaxshi natija ko'rsatdingiz!`,
        );
    }
    if (results.length === 0)
      recommendations.push(
        "A1 testdan boshlang va boshlang'ich darajangizni aniqlang!",
      );
    if (
      results.length > 0 &&
      Date.now() - new Date(results[0].created_at).getTime() >
        7 * 24 * 60 * 60 * 1000
    ) {
      recommendations.push(
        "Uzoq vaqt test ishlamadingiz. Mashq qilishni davom ettiring!",
      );
    }
    return recommendations.slice(0, 5);
  };

  const getSkillDistribution = () =>
    [
      {
        name: "Reading",
        value: results.filter((r) => r.skill === "reading").length,
      },
      {
        name: "Listening",
        value: results.filter((r) => r.skill === "listening").length,
      },
      {
        name: "Vocabulary",
        value: results.filter((r) => r.skill === "vocabulary").length,
      },
      {
        name: "Grammar",
        value: results.filter((r) => r.skill === "grammar").length,
      },
      {
        name: "Writing",
        value: results.filter((r) => r.skill === "writing").length,
      },
      {
        name: "Speaking",
        value: results.filter((r) => r.skill === "speaking").length,
      },
    ].filter((d) => d.value > 0);

  const getRadarData = () => {
    const skills = [
      "reading",
      "listening",
      "vocabulary",
      "grammar",
      "writing",
      "speaking",
    ];
    const labels: Record<string, string> = {
      reading: "Reading",
      listening: "Listening",
      vocabulary: "Lug'at",
      grammar: "Grammatika",
      writing: "Writing",
      speaking: "Speaking",
    };
    return skills.map((skill) => {
      const skillResults = results.filter((r) => r.skill === skill);
      const avg =
        skillResults.length > 0
          ? Math.round(
              skillResults.reduce((s, r) => s + r.percentage, 0) /
                skillResults.length,
            )
          : 0;
      return { skill: labels[skill] || skill, score: avg, fullMark: 100 };
    });
  };

  const getLevelDistribution = () => {
    const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
    return levels
      .map((level) => ({
        level,
        count: results.filter((r) => r.level === level).length,
        avgScore: Math.round(
          results
            .filter((r) => r.level === level)
            .reduce((sum, r) => sum + r.percentage, 0) /
            Math.max(1, results.filter((r) => r.level === level).length),
        ),
      }))
      .filter((d) => d.count > 0);
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const getTotalStats = () => {
    const totalTests = results.length;
    const averageScore =
      totalTests > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.percentage, 0) / totalTests,
          )
        : 0;
    const totalTime = results.reduce((sum, r) => sum + r.time_taken, 0);
    const passedTests = results.filter((r) => r.percentage >= 60).length;
    return { totalTests, averageScore, totalTime, passedTests };
  };

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  const stats = getTotalStats();
  const progressData = getProgressOverTime();
  const skillAnalysis = getSkillAnalysis();
  const levelAnalysis = getLevelAnalysis();
  const recommendations = getRecommendations();
  const skillDistribution = getSkillDistribution();
  const levelDistribution = getLevelDistribution();

  // --- Redesigned dashboard helpers ---
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech";
  const firstName = user?.email?.split("@")[0] || "Do'stim";

  const findSkill = (key: string) =>
    skillAnalysis.find((s) => s.skill === key) || {
      skill: key,
      averageScore: 0,
      totalTests: 0,
      trend: "stable" as const,
    };

  const continueLearningSkills = [
    { key: "vocabulary", label: "Lug'at", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "grammar", label: "Grammatika", icon: PenTool, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { key: "speaking", label: "Speaking", icon: Mic, color: "text-rose-500", bg: "bg-rose-500/10" },
    { key: "reading", label: "Reading", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
  ].map((s) => ({ ...s, score: findSkill(s.key).averageScore }));

  const weakSkillsRanked = [...skillAnalysis]
    .filter((s) => s.totalTests > 0)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 2);
  const weakestSkillLabel = weakSkillsRanked[0]?.skill
    ? weakSkillsRanked[0].skill.charAt(0).toUpperCase() + weakSkillsRanked[0].skill.slice(1)
    : null;

  const estimatedIELTS = (() => {
    if (stats.totalTests === 0) return null;
    const band = Math.round((stats.averageScore / 100) * 9 * 2) / 2;
    return Math.min(9, Math.max(3.5, band)).toFixed(1);
  })();

  const cefrPath: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  const currentCEFR: CEFRLevel =
    [...levelAnalysis].reverse().find((l) => l.testsCompleted > 0)?.level as CEFRLevel || "A1";

  const nextReward = achievements
    .filter((a) => !userAchievements.some((ua) => ua.achievement_id === a.id))
    .sort((a, b) => a.threshold - b.threshold)[0];
  const nextRewardProgress = nextReward
    ? Math.min(100, Math.round(((progress?.xp || 0) / Math.max(1, (nextReward.threshold || 10) * 20)) * 100))
    : 100;

  const studyTimeByDay = (() => {
    const days = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    results.forEach((r) => {
      const t = new Date(r.created_at).getTime();
      if (t >= weekAgo) totals[new Date(r.created_at).getDay()] += r.time_taken;
    });
    return days.map((d, i) => ({ day: d, minutes: Math.round(totals[i] / 60) }));
  })();
  const weeklyStudyMinutes = studyTimeByDay.reduce((s, d) => s + d.minutes, 0);

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight flex items-center gap-2">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bugungi kunni ham ajoyib o'quv kuniga aylantiramiz.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="relative w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
            {progress && progress.current_streak > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm font-semibold text-orange-500">
                <Flame className="w-4 h-4" /> {progress.current_streak} kunlik streak
              </div>
            )}
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
          {/* LEFT: Progress + Mission */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-2 relative overflow-hidden rounded-3xl border border-border/60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40"
              style={{ background: "hsl(var(--primary) / 0.4)" }}
            />
            <div className="relative p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Sizning taraqqiyotingiz
                </p>
                {progress && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
                        Daraja {progress.level}
                      </h2>
                      <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {progress.xp.toLocaleString()} / {(progress.level * 500).toLocaleString()} XP
                    </p>
                    <Progress value={xpProgress} className="h-3" />
                  </>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Bugungi vazifa
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Kunlik maqsadlaringizni bajaring
                </p>
                <div className="space-y-2">
                  {[
                    {
                      label: "25 ta yangi so'z o'rganish",
                      done: !!progress?.last_activity_date && progress.last_activity_date === new Date().toISOString().split("T")[0],
                      icon: CheckCircle,
                    },
                    { label: "Speaking mashqini yakunlash — 0 / 1", done: false, icon: Mic },
                    { label: "Mock testni yakunlash — 0 / 1", done: false, icon: Target },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          m.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <m.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={m.done ? "text-foreground" : "text-muted-foreground"}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative px-6 sm:px-8 pb-6 sm:pb-8">
              <Button className="w-full sm:w-auto" onClick={() => navigate("/practice")}>
                Davom etish <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </motion.div>

          {/* RIGHT: AI Coach */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="w-4 h-4 text-primary" /> AI Coach
                  <Badge variant="secondary" className="text-[10px]">Beta</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalTests > 0 ? "Kecha yaxshi ish qildingiz! 🎉 " : "Xush kelibsiz! "}
                    {weakestSkillLabel
                      ? `Bugun ${weakestSkillLabel} ko'nikmangizni yaxshilashingiz mumkin.`
                      : "Birinchi testni ishlab, kuchli va zaif tomonlaringizni aniqlang."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Zaif tomonlar
                    </p>
                    <div className="space-y-1.5">
                      {weakSkillsRanked.length > 0 ? (
                        weakSkillsRanked.map((s) => (
                          <div key={s.skill} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 capitalize">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {s.skill}
                            </span>
                            <span className="font-semibold">{s.averageScore}%</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Ma'lumot yo'q</p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Taxminiy IELTS
                    </p>
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90 absolute">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                        <circle
                          cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - (estimatedIELTS ? parseFloat(estimatedIELTS) / 9 : 0))}
                        />
                      </svg>
                      <span className="text-sm font-display font-bold">{estimatedIELTS || "—"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {estimatedIELTS ? (parseFloat(estimatedIELTS) >= 6.5 ? "Yaxshi" : "O'rtacha") : "Test ishlang"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { icon: Zap, value: stats.totalTests > 0 ? results[0]?.percentage ? "175" : "0" : "0", label: "Bugungi XP", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: BookOpen, value: (progress?.tests_completed || 0) * 3, label: "O'rganilgan so'zlar", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: Award, value: stats.passedTests, label: "Bajarilgan darslar", color: "text-purple-500", bg: "bg-purple-500/10" },
            { icon: Target, value: stats.totalTests, label: "Testlar soni", color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className={`p-2.5 ${s.bg} rounded-xl`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-display font-bold tracking-tight">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Weekly Activity / Continue Learning / Daily Challenges */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5 items-start">
          <StudyHeatmap results={results} />

          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Davom ettirish</CardTitle>
              <span className="text-xs text-muted-foreground">{continueLearningSkills.length} ta jarayonda</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {continueLearningSkills.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.score}%</span>
                    </div>
                    <Progress value={s.score} className="h-1.5" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <DailyChallenges />
        </div>

        {/* Achievements / Learning Journey / Upcoming Rewards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5 items-start">
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Yutuqlar</CardTitle>
              <span className="text-xs text-muted-foreground">
                {userAchievements.length} / {achievements.length}
              </span>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {achievements.slice(0, 5).map((ach) => {
                    const unlocked = userAchievements.some((ua) => ua.achievement_id === ach.id);
                    return (
                      <div key={ach.id} className="flex flex-col items-center gap-1 w-14">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            unlocked ? "bg-primary/10" : "bg-muted grayscale opacity-50"
                          }`}
                        >
                          {ach.icon}
                        </div>
                        <span className="text-[10px] text-center text-muted-foreground truncate w-full">
                          {ach.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Hali yutuqlar yo'q</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">O'quv yo'lingiz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-1.5 py-2 overflow-x-auto">
                {cefrPath.map((lvl, i) => {
                  const idx = cefrPath.indexOf(currentCEFR);
                  const isPast = i < idx;
                  const isCurrent = lvl === currentCEFR;
                  const isFuture = i > idx;
                  return (
                    <div key={lvl} className="flex items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary"
                              : isPast
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/40"
                                : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {isFuture ? <Lock className="w-3.5 h-3.5" /> : lvl}
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] text-primary font-semibold whitespace-nowrap">
                            Siz shu yerdasiz
                          </span>
                        )}
                      </div>
                      {i < cefrPath.length - 1 && (
                        <div className={`w-5 h-0.5 mx-0.5 ${i < idx ? "bg-emerald-500/40" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Keyingi mukofot</CardTitle>
              <CardDescription className="text-xs">
                {nextReward ? `${100 - nextRewardProgress}% qoldi` : "Barcha mukofotlar olindi"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90 absolute">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="27" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 27}
                    strokeDashoffset={2 * Math.PI * 27 * (1 - nextRewardProgress / 100)}
                  />
                </svg>
                <span className="text-sm font-display font-bold">{nextRewardProgress}%</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Gift className="w-4 h-4 text-primary shrink-0" />
                  <p className="font-semibold text-sm truncate">{nextReward?.title || "Barchasi bajarildi!"}</p>
                </div>
                {nextReward && (
                  <>
                    <p className="text-xs text-muted-foreground truncate">{nextReward.description}</p>
                    <p className="text-xs font-medium text-primary mt-1">+{nextReward.xp_reward} XP</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard + Study Time */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5 items-start">
          <Card className="border-border/50 xl:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="w-4 h-4 text-amber-500" /> Reyting jadvali
              </CardTitle>
              <span className="text-xs text-muted-foreground">Shu hafta</span>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.slice(0, 3).map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        entry.user_id === user?.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-muted text-muted-foreground shrink-0">
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="flex-1 min-w-0 text-sm font-medium truncate">
                        {entry.user_id === user?.id ? "Siz" : entry.full_name || "Foydalanuvchi"}
                      </p>
                      <p className="font-display font-bold text-sm">{entry.xp.toLocaleString()} XP</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Hali reyting mavjud emas</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">O'qish vaqti</CardTitle>
              <span className="text-xs text-muted-foreground">Shu hafta</span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-display font-black mb-3">
                {Math.floor(weeklyStudyMinutes / 60)}s {weeklyStudyMinutes % 60}d
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={studyTimeByDay}>
                  <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>


        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="skills">Ko'nikmalar</TabsTrigger>
            <TabsTrigger value="leaderboard">Reyting</TabsTrigger>
            <TabsTrigger value="achievements">Yutuqlar</TabsTrigger>
            <TabsTrigger value="history">Tarix</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Referral Widget */}
            <ReferralWidget />

            {/* AI Study Plan */}
            <AIStudyPlan results={results} />

            {/* Video Recommendations */}
            <VideoRecommendations
              weakSkills={skillAnalysis
                .filter((s) => s.averageScore < 60 && s.totalTests > 0)
                .map((s) => s.skill)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" /> Vaqt bo'yicha natijalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={progressData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis dataKey="test" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "13px",
                          }}
                          formatter={(value: number, _: string, props: any) => [
                            `${value}%`,
                            `${props.payload.skill} - ${props.payload.level}`,
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          dot={{
                            fill: "hsl(var(--primary))",
                            strokeWidth: 2,
                            r: 4,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                      Natijalarni ko'rish uchun test ishlang
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />{" "}
                    Tavsiyalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {skillAnalysis.map((skill) => (
                <Card key={skill.skill} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 capitalize text-base">
                      {skill.skill === "reading" ? (
                        <BookOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <Headphones className="h-4 w-4 text-primary" />
                      )}
                      {skill.skill}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {skill.totalTests} ta test
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        O'rtacha natija
                      </span>
                      <span className="text-xl font-display font-bold">
                        {skill.averageScore}%
                      </span>
                    </div>
                    <Progress value={skill.averageScore} className="h-2" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Trend:
                      </span>
                      <Badge
                        variant={
                          skill.trend === "up"
                            ? "default"
                            : skill.trend === "down"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {skill.trend === "up"
                          ? "↑ O'smoqda"
                          : skill.trend === "down"
                            ? "↓ Pasaymoqda"
                            : "→ Barqaror"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Skills Radar */}
          <TabsContent value="skills" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Ko'nikmalar Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Natija"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Ko'nikmalar taqsimoti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skillDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={skillDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {skillDistribution.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                      Ma'lumot yo'q
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-amber-500" /> Reyting jadvali
                </CardTitle>
                <CardDescription className="text-xs">
                  Eng yaxshi o'quvchilar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((entry, i) => (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${
                          entry.user_id === user?.id
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/50 hover:bg-muted/30"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            i === 0
                              ? "bg-amber-500/20 text-amber-600"
                              : i === 1
                                ? "bg-gray-300/20 text-gray-500"
                                : i === 2
                                  ? "bg-orange-400/20 text-orange-500"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {entry.full_name || "Foydalanuvchi"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Daraja {entry.level} • {entry.current_streak} kun
                            streak
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-sm">
                            {entry.xp.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            XP
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Hali reyting mavjud emas
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach, i) => {
                const unlocked = userAchievements.some(
                  (ua) => ua.achievement_id === ach.id,
                );
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className={`border-border/50 transition-all ${unlocked ? "ring-1 ring-primary/30" : "opacity-60"}`}
                    >
                      <CardContent className="pt-5 flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                            unlocked ? "bg-primary/10" : "bg-muted grayscale"
                          }`}
                        >
                          {ach.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-sm">
                              {ach.title}
                            </h4>
                            {unlocked && (
                              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ach.description}
                          </p>
                          <p className="text-xs font-medium text-primary mt-1">
                            +{ach.xp_reward} XP
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Test tarixi</CardTitle>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {result.skill} - {result.level}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(result.created_at).toLocaleDateString()}{" "}
                              • {formatTime(result.time_taken)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-base font-bold ${result.percentage >= 60 ? "text-emerald-500" : "text-destructive"}`}
                          >
                            {result.percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.correct_answers}/{result.total_questions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p>Hali test ishlanmagan</p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => navigate("/practice")}
                    >
                      Testni boshlash
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AchievementToast
        achievement={newAchievement}
        onDismiss={dismissAchievement}
      />
    </AppLayout>
  );
}
