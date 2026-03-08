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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="history">Tarix</TabsTrigger>
            <TabsTrigger value="analysis">Tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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

          <TabsContent value="history">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Test tarixi</CardTitle>
                <CardDescription className="text-xs">Barcha ishlangan testlar</CardDescription>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map(result => (
                      <div key={result.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${result.skill === 'reading' ? 'bg-primary/10' : 'bg-blue-500/10'}`}>
                            {result.skill === 'reading' ? <BookOpen className="h-4 w-4 text-primary" /> : <Headphones className="h-4 w-4 text-blue-500" />}
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

          <TabsContent value="analysis" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Ko'nikmalar taqsimoti</CardTitle>
                </CardHeader>
                <CardContent>
                  {skillDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={skillDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {skillDistribution.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daraja bo'yicha natijalar</CardTitle>
                </CardHeader>
                <CardContent>
                  {levelDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={levelDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="level" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px' }} formatter={(value: number) => [`${value}%`, "O'rtacha"]} />
                        <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daraja bo'yicha progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {levelAnalysis.map(level => (
                    <div key={level.level} className={`p-4 rounded-xl border text-center ${level.recommended ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/50'}`}>
                      <p className="text-xl font-display font-bold mb-0.5">{level.level}</p>
                      <p className="text-base font-semibold text-primary">{level.averageScore}%</p>
                      <p className="text-[10px] text-muted-foreground">{level.testsCompleted} test</p>
                      {level.recommended && <Badge variant="default" className="mt-2 text-[10px]">O'zlashtirilgan</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
