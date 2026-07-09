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
  Bot,
  Gift,
  Lock,
  ChevronRight,
  ChevronLeft,
  Mic,
  PenTool,
  SlidersHorizontal,
  TrendingDown,
  Sparkles,
  HelpCircle,
  UserPlus,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { CEFRLevel } from "@/types/cefr";
import { Header } from "@/components/Header";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useGamification } from "@/hooks/useGamification";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getWordBankFromStorage,
  getWordsLearnedToday,
  DAILY_WORD_GOAL,
} from "@/lib/wordActivity";
import { AchievementToast } from "@/components/AchievementToast";
import { StudyHeatmap } from "@/components/dashboard/StudyHeatmap";
import { HeroIllustration, RobotAvatar, TreasureChestIcon } from "@/components/dashboard/DashboardIllustrations";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardOnboarding } from "@/components/dashboard/DashboardOnboarding";
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

const DAILY_XP_GOAL = 100;

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
    XP_PER_TEST,
    XP_PER_CORRECT,
  } = useGamification();
  const { isPro, loading: subLoading } = useSubscription();

  // Real "today's mission" data: daily challenges + mock test attempts
  const [todayChallenges, setTodayChallenges] = useState<
    { id: string; title: string; xp_reward: number }[]
  >([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [mockTestsToday, setMockTestsToday] = useState(0);
  const [challengesXPEarnedToday, setChallengesXPEarnedToday] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);
  const [topFriend, setTopFriend] = useState<{ full_name: string; xp: number } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  useEffect(() => {
    if (user) fetchTodayMissionData();
  }, [user]);

  useEffect(() => {
    if (user) fetchFriendsPreview();
  }, [user]);

  const fetchFriendsPreview = async () => {
    if (!user) return;
    try {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      const { count: pendingCount } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("friend_id", user.id)
        .eq("status", "pending");
      setPendingFriendRequests(pendingCount || 0);

      const friendIds = (friendships || []).map((f: any) =>
        f.user_id === user.id ? f.friend_id : f.user_id,
      );
      setFriendsCount(friendIds.length);

      if (friendIds.length > 0) {
        const { data: friendProgress } = await supabase
          .from("user_progress")
          .select("user_id, xp")
          .in("user_id", friendIds)
          .order("xp", { ascending: false })
          .limit(1);
        if (friendProgress && friendProgress.length > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", friendProgress[0].user_id)
            .maybeSingle();
          setTopFriend({ full_name: profile?.full_name || "Do'st", xp: friendProgress[0].xp });
        }
      }
    } catch (err) {
      console.error("Friends preview fetch error:", err);
    }
  };

  const fetchTodayMissionData = async () => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    try {
      const { data: chData } = await supabase.functions.invoke(
        "generate-daily-challenges",
      );
      const challenges = (chData?.challenges || []) as {
        id: string;
        title: string;
        xp_reward: number;
      }[];
      setTodayChallenges(challenges);

      const { data: comps } = await supabase
        .from("user_daily_challenges")
        .select("challenge_id, xp_earned, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", todayStart.toISOString());
      const challengeIds = challenges.map((c) => c.id);
      const todaysComps = ((comps || []) as any[]).filter((c) =>
        challengeIds.includes(c.challenge_id),
      );
      setCompletedChallengeIds(todaysComps.map((c) => c.challenge_id));
      setChallengesXPEarnedToday(
        todaysComps.reduce((sum, c) => sum + (c.xp_earned || 0), 0),
      );

      const { count } = await supabase
        .from("mock_test_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());
      setMockTestsToday(count || 0);
    } catch (err) {
      console.error("Today mission fetch error:", err);
    }
  };

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
        <DashboardSkeleton />
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

  const nextReward = achievements
    .filter((a) => !userAchievements.some((ua) => ua.achievement_id === a.id))
    .sort((a, b) => (a.threshold || 0) - (b.threshold || 0))[0];

  // Real progress-toward-next-reward, based on the metric the achievement key actually tracks
  const getAchievementProgress = (ach: typeof achievements[number] | undefined) => {
    if (!ach) return { current: 0, target: 1, pct: 100 };
    const target = ach.threshold || 1;
    let current = 0;
    if (ach.key?.startsWith("tests")) current = progress?.tests_completed || 0;
    else if (ach.key?.startsWith("streak")) current = progress?.current_streak || 0;
    else if (ach.key?.startsWith("level")) current = progress?.level || 0;
    else current = 0; // special conditions (perfect score, speed, all skills) — not a simple counter
    return { current, target, pct: Math.min(100, Math.round((current / target) * 100)) };
  };
  const nextRewardProgress = getAchievementProgress(nextReward);

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

  const strongestSkill = [...skillAnalysis]
    .filter((s) => s.totalTests > 0)
    .sort((a, b) => b.averageScore - a.averageScore)[0];

  // Real "today's XP": actual test results submitted today (using the same XP formula as useGamification)
  // plus any daily-challenge XP actually earned today.
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const resultsTodayXP = results
    .filter((r) => r.created_at.startsWith(todayStr))
    .reduce((sum, r) => sum + XP_PER_TEST + r.correct_answers * XP_PER_CORRECT, 0);
  const resultsYesterdayXP = results
    .filter((r) => r.created_at.startsWith(yesterdayStr))
    .reduce((sum, r) => sum + XP_PER_TEST + r.correct_answers * XP_PER_CORRECT, 0);
  const todaysXP = resultsTodayXP + challengesXPEarnedToday;
  const xpChangePct =
    resultsYesterdayXP > 0
      ? Math.round(((todaysXP - resultsYesterdayXP) / resultsYesterdayXP) * 100)
      : todaysXP > 0
        ? 100
        : 0;

  // Real "Today's Mission" — backed by actual word-learning activity, speaking practice, and mock tests today
  const speakingDoneToday = results.some(
    (r) => r.skill === "speaking" && r.created_at.startsWith(todayStr),
  );
  const wordsLearnedToday = getWordsLearnedToday(getWordBankFromStorage());
  const missionItems = [
    {
      label: `${DAILY_WORD_GOAL} ta so'z bilan shug'ullanish`,
      progressLabel: `${Math.min(wordsLearnedToday, DAILY_WORD_GOAL)} / ${DAILY_WORD_GOAL}`,
      done: wordsLearnedToday >= DAILY_WORD_GOAL,
      icon: BookOpen,
    },
    {
      label: "Speaking mashqini yakunlash",
      progressLabel: speakingDoneToday ? "1 / 1" : "0 / 1",
      done: speakingDoneToday,
      icon: Mic,
    },
    {
      label: "Mock testni yakunlash",
      progressLabel: `${mockTestsToday} / 1`,
      done: mockTestsToday >= 1,
      icon: Target,
    },
  ];
  const missionDoneCount = missionItems.filter((m) => m.done).length;
  const missionProgressPct = Math.round((missionDoneCount / missionItems.length) * 100);

  // Real weekly goal: tests actually completed in the last 7 days vs a 7-test weekly target
  const testsThisWeek = results.filter(
    (r) => new Date(r.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).length;
  const weeklyGoalPct = Math.min(100, Math.round((testsThisWeek / 7) * 100));

  const quickActions = [
    { label: "Learn Words", icon: BookOpen, color: "text-emerald-500", path: "/wordbank" },
    { label: "Mock Test", icon: Target, color: "text-blue-500", path: "/mock-tests" },
    { label: "Speaking Practice", icon: Mic, color: "text-purple-500", path: "/practice" },
    { label: "Daily Challenge", icon: Gift, color: "text-amber-500", path: "/games" },
    { label: "Video Lesson", icon: BarChart3, color: "text-rose-500", path: "/videos" },
  ];

  const leaderboardWithGap = (() => {
    if (leaderboard.length === 0) return { rows: [], gapToFirst: 0 };
    const first = leaderboard[0]?.xp || 0;
    const meIndex = leaderboard.findIndex((e) => e.user_id === user?.id);
    const myXP = meIndex >= 0 ? leaderboard[meIndex].xp : progress?.xp || 0;
    return { rows: leaderboard.slice(0, 4), gapToFirst: Math.max(0, first - myXP) };
  })();

  return (
    <AppLayout>
      <DashboardOnboarding
        forceOpen={showTour}
        onClose={() => setShowTour(false)}
      />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight flex items-center gap-2 flex-wrap">
              {greeting}, <span className="text-primary">{firstName}</span>! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Keep learning, keep growing. Bugun ham ajoyib kun bo'lsin! 🚀
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
                navigate(q ? `/wordbank?q=${encodeURIComponent(q)}` : "/wordbank");
              }}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/60 text-sm text-muted-foreground w-52 focus-within:border-primary/50 transition-colors"
            >
              <Search className="w-4 h-4 shrink-0" />
              <input
                name="q"
                placeholder="So'z qidirish..."
                className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
              />
            </form>
            <div className="shrink-0">
              <NotificationBell />
            </div>
            {progress && progress.current_streak > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm font-semibold text-orange-500 shrink-0">
                <Flame className="w-4 h-4" /> {progress.current_streak} kunlik streak
              </div>
            )}
            <button
              onClick={() => setShowTour(true)}
              className="w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors shrink-0"
              title="Qo'llanmani ko'rish"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors shrink-0"
              title="Sozlamalar"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {stats.totalTests === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-6 mb-5 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold">Hali birorta test ishlamagansiz</p>
                <p className="text-sm text-muted-foreground">
                  Birinchi testni ishlab, AI Coach sizning kuchli va zaif tomonlaringizni aniqlasin!
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/mock-tests")} className="shrink-0">
              Birinchi testni boshlash <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </motion.div>
        )}

        {/* Hero: Your Progress + AI Coach */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-2 relative overflow-hidden rounded-3xl border border-border/60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-fuchsia-500/5 to-transparent" />
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40"
              style={{ background: "hsl(var(--primary) / 0.4)" }}
            />
            <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full blur-3xl opacity-30 bg-fuchsia-500/40" />
            <Sparkles className="absolute top-6 right-40 w-5 h-5 text-primary/40 hidden sm:block" />
            <Sparkles className="absolute bottom-10 right-64 w-3.5 h-3.5 text-fuchsia-400/40 hidden lg:block" />
            <HeroIllustration className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 w-52 lg:w-64 h-auto opacity-90 pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
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
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {progress.xp.toLocaleString()} / {(progress.level * 500).toLocaleString()} XP
                      </p>
                      <div className="flex items-center gap-3 max-w-md">
                        <Progress value={xpProgress} className="h-3 flex-1" />
                        <span className="text-sm font-bold text-primary shrink-0 w-10 text-right">
                          {xpProgress}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Next Reward floating card */}
                <div className="shrink-0 p-3.5 rounded-2xl bg-background/60 backdrop-blur border border-border/60 text-center min-w-[130px]">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Keyingi mukofot
                  </p>
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-1.5">
                    <TreasureChestIcon className="w-9 h-9" />
                  </div>
                  <p className="text-xs font-semibold truncate max-w-[110px] mx-auto">
                    {nextReward?.title || "Barchasi olindi!"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {nextReward
                      ? `${nextRewardProgress.current} / ${nextRewardProgress.target}`
                      : "🎉"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="font-display font-bold leading-none">{progress?.current_streak || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Day Streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="font-display font-bold leading-none">{(progress?.xp || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Total XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="font-display font-bold leading-none">{userAchievements.length}</p>
                    <p className="text-[10px] text-muted-foreground">Badges</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="font-display font-bold leading-none">{weeklyGoalPct}%</p>
                    <p className="text-[10px] text-muted-foreground">Week Goal</p>
                  </div>
                </div>
              </div>

              <Button className="w-full sm:w-auto" onClick={() => navigate("/practice")}>
                Continue Learning <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </motion.div>

          {/* AI Coach */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
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
                    <RobotAvatar className="w-9 h-9" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalTests > 0 ? "Kecha yaxshi ish qildingiz! 🎉 " : "Xush kelibsiz! "}
                    {weakestSkillLabel
                      ? `Bugun ${weakestSkillLabel} ko'nikmangizga e'tibor bering.`
                      : "Birinchi testni ishlab, kuchli va zaif tomonlaringizni aniqlang."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Weak Skill
                    </p>
                    {weakSkillsRanked[0] ? (
                      <>
                        <span className="flex items-center gap-1 text-xs font-semibold capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {weakSkillsRanked[0].skill}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          {weakSkillsRanked[0].averageScore}% <TrendingDown className="w-3 h-3 text-red-500" />
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Strong Skill
                    </p>
                    {strongestSkill ? (
                      <>
                        <span className="flex items-center gap-1 text-xs font-semibold capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> {strongestSkill.skill}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          {strongestSkill.averageScore}% <TrendingUp className="w-3 h-3 text-emerald-500" />
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col items-center text-center">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Est. IELTS
                    </p>
                    <span className="text-lg font-display font-bold leading-none">{estimatedIELTS || "—"}</span>
                    {estimatedIELTS && (
                      <span className="text-[9px] text-emerald-500 mt-0.5">
                        {parseFloat(estimatedIELTS) >= 6.5 ? "Good" : "O'rtacha"}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50 mb-5">
          <CardContent className="py-3.5 flex items-center gap-2.5 overflow-x-auto">
            <span className="text-sm font-semibold shrink-0 pr-3 mr-1 border-r border-border/50 whitespace-nowrap">
              Quick Actions
            </span>
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted/60 transition-colors whitespace-nowrap"
              >
                <a.icon className={`w-4 h-4 ${a.color}`} /> {a.label}
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Today's Mission / Weekly Activity / Today's XP / Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5 mb-5 items-start">
          {/* Today's Mission */}
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today's Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {missionItems.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    m.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      m.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${m.done ? "" : "text-muted-foreground"}`}>
                      {m.label}
                    </p>
                    {m.done && <Progress value={100} className="h-1 mt-1" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{m.progressLabel}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Mission Progress</span>
                  <span className="text-xs font-bold text-primary">{missionProgressPct}%</span>
                </div>
                <Progress value={missionProgressPct} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <StudyHeatmap results={results} />

          {/* Today's XP radial gauge */}
          <Card className="border-border/50 h-full">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90 absolute">
                  <defs>
                    <linearGradient id="xpRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#eab308" />
                    </linearGradient>
                  </defs>
                  <circle cx="64" cy="64" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <motion.circle
                    cx="64" cy="64" r="54" fill="none" stroke="url(#xpRing)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 54}
                    initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - Math.min(1, todaysXP / DAILY_XP_GOAL)) }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Today's XP</p>
                  <p className="text-2xl font-display font-black">{todaysXP}</p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>
              <p className={`text-[11px] font-medium flex items-center gap-1 ${xpChangePct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {xpChangePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {xpChangePct >= 0 ? `${xpChangePct}%` : `${Math.abs(xpChangePct)}%`} kechadan {xpChangePct >= 0 ? "ko'proq" : "kamroq"}
              </p>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Leaderboard</CardTitle>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">This Week <ChevronLeft className="w-3 h-3 rotate-[-90deg]" /></span>
            </CardHeader>
            <CardContent>
              {leaderboardWithGap.rows.length > 0 ? (
                <div className="space-y-1.5">
                  {leaderboardWithGap.rows.map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                        entry.user_id === user?.id ? "border-primary/50 bg-primary/5" : "border-border/50"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] bg-muted text-muted-foreground shrink-0">
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                        {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="flex-1 min-w-0 text-xs font-medium truncate">
                        {entry.user_id === user?.id ? "You" : entry.full_name || "Foydalanuvchi"}
                      </p>
                      <p className="font-display font-bold text-xs">{entry.xp.toLocaleString()} XP</p>
                    </div>
                  ))}
                  {leaderboardWithGap.gapToFirst > 0 && (
                    <p className="text-[11px] text-muted-foreground pt-1">
                      You are <span className="text-primary font-semibold">{leaderboardWithGap.gapToFirst} XP</span> away from #1 🏆
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Hali reyting mavjud emas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning / Achievements / Study Time */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5 items-start">
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Continue Learning</CardTitle>
              <button onClick={() => navigate("/practice")} className="text-xs text-primary font-medium flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {continueLearningSkills.map((s) => (
                <div key={s.key} className={`p-3 rounded-2xl ${s.bg} border border-border/50`}>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                  </div>
                  <p className="text-xs font-semibold mb-1.5">{s.label}</p>
                  <Progress value={s.score} className="h-1.5 mb-1" />
                  <span className="text-[10px] text-muted-foreground">{s.score}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Achievements</CardTitle>
              <button onClick={() => navigate("/profile")} className="text-xs text-primary font-medium flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {achievements.slice(0, 5).map((ach) => {
                    const unlocked = userAchievements.some((ua) => ua.achievement_id === ach.id);
                    return (
                      <div key={ach.id} className="flex flex-col items-center gap-1 w-14">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            unlocked
                              ? "bg-gradient-to-br from-primary/20 to-fuchsia-500/20 ring-1 ring-primary/30"
                              : "bg-muted grayscale opacity-50"
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
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Study Time</CardTitle>
              <span className="text-xs text-muted-foreground">This Week</span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-display font-black mb-3">
                {Math.floor(weeklyStudyMinutes / 60)}h {weeklyStudyMinutes % 60}m
              </p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={studyTimeByDay}>
                  <XAxis dataKey="day" fontSize={9} axisLine={false} tickLine={false} />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Business row: Pro Plan CTA + Referral + Friends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 items-stretch">
          {!subLoading && !isPro ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 flex flex-col justify-between"
            >
              <div
                className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-30 bg-amber-500/40"
              />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base">Pro Planga o'ting</h3>
                    <p className="text-xs text-muted-foreground">Barcha imkoniyatlarni oching</p>
                  </div>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      <Mic className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Speaking testlari — hozir qulflangan
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      <PenTool className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Writing testlari — hozir qulflangan
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Cheksiz mock testlar va reklamasiz tajriba
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/pricing")}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0"
              >
                Pro'ga yangilash <Crown className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 flex flex-col justify-center items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-3">
                <Crown className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="font-display font-black text-base mb-1">Siz Pro foydalanuvchisiz! 👑</h3>
              <p className="text-sm text-muted-foreground">
                Barcha Speaking, Writing va mock testlardan cheklovsiz foydalanmoqdasiz. Rahmat!
              </p>
            </motion.div>
          )}

          <ReferralWidget />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-border/60 p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base">Do'stlar</h3>
                    <p className="text-xs text-muted-foreground">{friendsCount} ta do'st</p>
                  </div>
                </div>
                {pendingFriendRequests > 0 && (
                  <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {pendingFriendRequests}
                  </span>
                )}
              </div>

              {topFriend ? (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {topFriend.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{topFriend.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">Eng faol do'stingiz</p>
                  </div>
                  <p className="text-xs font-display font-bold shrink-0">{topFriend.xp.toLocaleString()} XP</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Do'stlaringizni qo'shing va birga XP to'plang — raqobat qiziqarliroq!
                </p>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate("/friends")}>
              {friendsCount > 0 ? "Do'stlarni ko'rish" : "Do'st qo'shish"}{" "}
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </motion.div>
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
            {/* Daily Challenges */}
            <DailyChallenges />

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
