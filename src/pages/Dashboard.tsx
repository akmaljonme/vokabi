import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowLeft, TrendingUp, Target, Clock, Award, BookOpen, Headphones, AlertTriangle, CheckCircle, BarChart3, Flame, Zap, Trophy, Star, Crown, Medal } from 'lucide-react';
import { CEFRLevel } from '@/types/cefr';
import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';
import { AchievementToast } from '@/components/AchievementToast';
import { StudyHeatmap } from '@/components/dashboard/StudyHeatmap';
import { AIStudyPlan } from '@/components/dashboard/AIStudyPlan';
import { DailyChallenges } from '@/components/dashboard/DailyChallenges';

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
  trend: 'up' | 'down' | 'stable';
  recentPerformance: number[];
}

interface LevelAnalysis {
  level: string;
  averageScore: number;
  testsCompleted: number;
  recommended: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(173 80% 40%)', 'hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(25 95% 53%)', 'hsl(270 60% 55%)'];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { progress, achievements, userAchievements, leaderboard, newAchievement, dismissAchievement, xpProgress, xpToNextLevel, userRank, loading: gamLoading } = useGamification();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResults((data || []) as unknown as TestResult[]);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressOverTime = () => {
    const sortedResults = [...results].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
    const skills = ['reading', 'listening', 'vocabulary', 'grammar', 'writing', 'speaking'];
    return skills.map(skill => {
      const skillResults = results.filter(r => r.skill === skill);
      const averageScore = skillResults.length > 0
        ? skillResults.reduce((sum, r) => sum + r.percentage, 0) / skillResults.length : 0;
      const recentResults = skillResults.slice(0, 5).map(r => r.percentage);
      const trend = recentResults.length >= 2
        ? recentResults[0] > recentResults[recentResults.length - 1] ? 'up' : 
          recentResults[0] < recentResults[recentResults.length - 1] ? 'down' : 'stable'
        : 'stable';
      return { skill, averageScore: Math.round(averageScore), totalTests: skillResults.length, trend, recentPerformance: recentResults.reverse() };
    });
  };

  const getLevelAnalysis = (): LevelAnalysis[] => {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    return levels.map(level => {
      const levelResults = results.filter(r => r.level === level);
      const averageScore = levelResults.length > 0
        ? levelResults.reduce((sum, r) => sum + r.percentage, 0) / levelResults.length : 0;
      return { level, averageScore: Math.round(averageScore), testsCompleted: levelResults.length, recommended: averageScore >= 70 && levelResults.length >= 2 };
    });
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    const skillAnalysis = getSkillAnalysis();
    const levelAnalysis = getLevelAnalysis();
    skillAnalysis.forEach(skill => {
      if (skill.averageScore < 50 && skill.totalTests > 0) recommendations.push(`${skill.skill} ko'nikmangizga e'tibor bering — o'rtacha ${skill.averageScore}%`);
      if (skill.trend === 'down' && skill.totalTests >= 3) recommendations.push(`${skill.skill} natijalaringiz pasaymoqda. Asosiy mavzularni takrorlang.`);
    });
    const highestPassingLevel = levelAnalysis.filter(l => l.averageScore >= 60 && l.testsCompleted > 0);
    if (highestPassingLevel.length > 0) {
      const highest = highestPassingLevel[highestPassingLevel.length - 1];
      const allLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
      const nextIndex = allLevels.indexOf(highest.level as CEFRLevel) + 1;
      if (nextIndex < 5) recommendations.push(`${allLevels[nextIndex]} darajasini sinab ko'ring — ${highest.level}da yaxshi natija ko'rsatdingiz!`);
    }
    if (results.length === 0) recommendations.push('A1 testdan boshlang va boshlang\'ich darajangizni aniqlang!');
    if (results.length > 0 && Date.now() - new Date(results[0].created_at).getTime() > 7 * 24 * 60 * 60 * 1000) {
      recommendations.push('Uzoq vaqt test ishlamadingiz. Mashq qilishni davom ettiring!');
    }
    return recommendations.slice(0, 5);
  };

  const getSkillDistribution = () => [
    { name: 'Reading', value: results.filter(r => r.skill === 'reading').length },
    { name: 'Listening', value: results.filter(r => r.skill === 'listening').length },
    { name: 'Vocabulary', value: results.filter(r => r.skill === 'vocabulary').length },
    { name: 'Grammar', value: results.filter(r => r.skill === 'grammar').length },
    { name: 'Writing', value: results.filter(r => r.skill === 'writing').length },
    { name: 'Speaking', value: results.filter(r => r.skill === 'speaking').length },
  ].filter(d => d.value > 0);

  const getRadarData = () => {
    const skills = ['reading', 'listening', 'vocabulary', 'grammar', 'writing', 'speaking'];
    const labels: Record<string, string> = {
      reading: 'Reading', listening: 'Listening', vocabulary: "Lug'at",
      grammar: 'Grammatika', writing: 'Writing', speaking: 'Speaking',
    };
    return skills.map(skill => {
      const skillResults = results.filter(r => r.skill === skill);
      const avg = skillResults.length > 0 ? Math.round(skillResults.reduce((s, r) => s + r.percentage, 0) / skillResults.length) : 0;
      return { skill: labels[skill] || skill, score: avg, fullMark: 100 };
    });
  };

  const getLevelDistribution = () => {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    return levels.map(level => ({
      level,
      count: results.filter(r => r.level === level).length,
      avgScore: Math.round(results.filter(r => r.level === level).reduce((sum, r) => sum + r.percentage, 0) / Math.max(1, results.filter(r => r.level === level).length)),
    })).filter(d => d.count > 0);
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const getTotalStats = () => {
    const totalTests = results.length;
    const averageScore = totalTests > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalTests) : 0;
    const totalTime = results.reduce((sum, r) => sum + r.time_taken, 0);
    const passedTests = results.filter(r => r.percentage >= 60).length;
    return { totalTests, averageScore, totalTime, passedTests };
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = getTotalStats();
  const progressData = getProgressOverTime();
  const skillAnalysis = getSkillAnalysis();
  const levelAnalysis = getLevelAnalysis();
  const recommendations = getRecommendations();
  const skillDistribution = getSkillDistribution();
  const levelDistribution = getLevelDistribution();

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => navigate('/')} />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">O'quv jarayoningizni kuzating</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Target, value: stats.totalTests, label: 'Testlar', iconColor: 'text-primary', bgColor: 'bg-primary/10' },
            { icon: TrendingUp, value: `${stats.averageScore}%`, label: 'O\'rtacha', iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
            { icon: Clock, value: formatTime(stats.totalTime), label: 'Umumiy vaqt', iconColor: 'text-blue-500', bgColor: 'bg-blue-500/10' },
            { icon: Award, value: stats.passedTests, label: 'O\'tgan (60%+)', iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 ${stat.bgColor} rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold tracking-tight">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Gamification Section */}
        {progress && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* XP & Level */}
            <Card className="border-border/50 lg:col-span-2">
              <CardContent className="pt-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="relative shrink-0">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center border border-primary/20"
                    >
                      <Crown className="w-5 h-5 text-primary mb-0.5" />
                      <span className="text-2xl font-display font-bold">{progress.level}</span>
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-primary" />
                        {progress.xp.toLocaleString()} XP
                      </span>
                      <span className="text-xs text-muted-foreground">{xpToNextLevel} XP keyingi darajaga</span>
                    </div>
                    <Progress value={xpProgress} className="h-3 mb-3" />
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      <div className="flex items-center gap-1.5">
                        <Flame className={`w-4 h-4 ${progress.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-semibold">{progress.current_streak} kun</span>
                        <span className="text-xs text-muted-foreground">streak</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold">{userAchievements.length}/{achievements.length}</span>
                        <span className="text-xs text-muted-foreground">yutuq</span>
                      </div>
                      {userRank > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Medal className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">#{userRank}</span>
                          <span className="text-xs text-muted-foreground">reyting</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streak Calendar */}
            <Card className="border-border/50">
              <CardContent className="pt-5">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                      progress.current_streak > 0
                        ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30'
                        : 'bg-muted'
                    }`}
                  >
                    <Flame className={`w-8 h-8 ${progress.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <p className="text-3xl font-display font-bold">{progress.current_streak}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">kunlik streak</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Eng yaxshi: {progress.longest_streak} kun</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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

            {/* Study Heatmap */}
            <StudyHeatmap results={results} />

            {/* AI Study Plan */}
            <AIStudyPlan results={results} />

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
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="test" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px' }}
                          formatter={(value: number, _: string, props: any) => [`${value}%`, `${props.payload.skill} - ${props.payload.level}`]}
                        />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} />
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
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Tavsiyalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {skillAnalysis.map(skill => (
                <Card key={skill.skill} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 capitalize text-base">
                      {skill.skill === 'reading' ? <BookOpen className="h-4 w-4 text-primary" /> : <Headphones className="h-4 w-4 text-primary" />}
                      {skill.skill}
                    </CardTitle>
                    <CardDescription className="text-xs">{skill.totalTests} ta test</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">O'rtacha natija</span>
                      <span className="text-xl font-display font-bold">{skill.averageScore}%</span>
                    </div>
                    <Progress value={skill.averageScore} className="h-2" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Trend:</span>
                      <Badge variant={skill.trend === 'up' ? 'default' : skill.trend === 'down' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {skill.trend === 'up' ? '↑ O\'smoqda' : skill.trend === 'down' ? '↓ Pasaymoqda' : '→ Barqaror'}
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
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Natija" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-base">Ko'nikmalar taqsimoti</CardTitle></CardHeader>
                <CardContent>
                  {skillDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={skillDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {skillDistribution.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-amber-500" /> Reyting jadvali</CardTitle>
                <CardDescription className="text-xs">Eng yaxshi o'quvchilar</CardDescription>
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
                          entry.user_id === user?.id ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-amber-500/20 text-amber-600' :
                          i === 1 ? 'bg-gray-300/20 text-gray-500' :
                          i === 2 ? 'bg-orange-400/20 text-orange-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {entry.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{entry.full_name || 'Foydalanuvchi'}</p>
                          <p className="text-xs text-muted-foreground">Daraja {entry.level} • {entry.current_streak} kun streak</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-sm">{entry.xp.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">XP</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">Hali reyting mavjud emas</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach, i) => {
                const unlocked = userAchievements.some(ua => ua.achievement_id === ach.id);
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className={`border-border/50 transition-all ${unlocked ? 'ring-1 ring-primary/30' : 'opacity-60'}`}>
                      <CardContent className="pt-5 flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                          unlocked ? 'bg-primary/10' : 'bg-muted grayscale'
                        }`}>
                          {ach.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-sm">{ach.title}</h4>
                            {unlocked && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{ach.description}</p>
                          <p className="text-xs font-medium text-primary mt-1">+{ach.xp_reward} XP</p>
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
                    {results.map(result => (
                      <div key={result.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm capitalize">{result.skill} - {result.level}</p>
                            <p className="text-xs text-muted-foreground">{new Date(result.created_at).toLocaleDateString()} • {formatTime(result.time_taken)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-bold ${result.percentage >= 60 ? 'text-emerald-500' : 'text-destructive'}`}>{result.percentage}%</p>
                          <p className="text-xs text-muted-foreground">{result.correct_answers}/{result.total_questions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p>Hali test ishlanmagan</p>
                    <Button className="mt-4" size="sm" onClick={() => navigate('/')}>Testni boshlash</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AchievementToast achievement={newAchievement} onDismiss={dismissAchievement} />
    </div>
  );
}
