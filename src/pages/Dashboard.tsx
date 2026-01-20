import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, Target, Clock, Award, BookOpen, Headphones, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { CEFRLevel } from '@/types/cefr';
import { Header } from '@/components/Header';

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

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
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
    const skills = ['reading', 'listening'];
    return skills.map(skill => {
      const skillResults = results.filter(r => r.skill === skill);
      const averageScore = skillResults.length > 0
        ? skillResults.reduce((sum, r) => sum + r.percentage, 0) / skillResults.length
        : 0;
      
      const recentResults = skillResults.slice(0, 5).map(r => r.percentage);
      const trend = recentResults.length >= 2
        ? recentResults[0] > recentResults[recentResults.length - 1] ? 'up' : 
          recentResults[0] < recentResults[recentResults.length - 1] ? 'down' : 'stable'
        : 'stable';

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
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const analyses = levels.map(level => {
      const levelResults = results.filter(r => r.level === level);
      const averageScore = levelResults.length > 0
        ? levelResults.reduce((sum, r) => sum + r.percentage, 0) / levelResults.length
        : 0;

      return {
        level,
        averageScore: Math.round(averageScore),
        testsCompleted: levelResults.length,
        recommended: averageScore >= 70 && levelResults.length >= 2,
      };
    });

    return analyses;
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    const skillAnalysis = getSkillAnalysis();
    const levelAnalysis = getLevelAnalysis();

    skillAnalysis.forEach(skill => {
      if (skill.averageScore < 50 && skill.totalTests > 0) {
        recommendations.push(`Focus on ${skill.skill} skills - your average score is ${skill.averageScore}%`);
      }
      if (skill.trend === 'down' && skill.totalTests >= 3) {
        recommendations.push(`Your ${skill.skill} scores are declining. Consider reviewing fundamentals.`);
      }
    });

    const highestPassingLevel = levelAnalysis.filter(l => l.averageScore >= 60 && l.testsCompleted > 0);
    if (highestPassingLevel.length > 0) {
      const highest = highestPassingLevel[highestPassingLevel.length - 1];
      const allLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
      const nextLevelIndex = allLevels.indexOf(highest.level as CEFRLevel) + 1;
      if (nextLevelIndex < 5) {
        const nextLevel = allLevels[nextLevelIndex];
        recommendations.push(`Ready to try ${nextLevel}? You've been doing well at ${highest.level}!`);
      }
    }

    if (results.length === 0) {
      recommendations.push('Start with an A1 test to establish your baseline level!');
    }

    if (results.length > 0 && new Date().getTime() - new Date(results[0].created_at).getTime() > 7 * 24 * 60 * 60 * 1000) {
      recommendations.push('You haven\'t taken a test in a while. Keep practicing to maintain your skills!');
    }

    return recommendations.slice(0, 5);
  };

  const getSkillDistribution = () => {
    const reading = results.filter(r => r.skill === 'reading').length;
    const listening = results.filter(r => r.skill === 'listening').length;
    return [
      { name: 'Reading', value: reading },
      { name: 'Listening', value: listening },
    ].filter(d => d.value > 0);
  };

  const getLevelDistribution = () => {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    return levels.map(level => ({
      level,
      count: results.filter(r => r.level === level).length,
      avgScore: Math.round(
        results.filter(r => r.level === level).reduce((sum, r) => sum + r.percentage, 0) / 
        Math.max(1, results.filter(r => r.level === level).length)
      ),
    })).filter(d => d.count > 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTotalStats = () => {
    const totalTests = results.length;
    const averageScore = totalTests > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalTests)
      : 0;
    const totalTime = results.reduce((sum, r) => sum + r.time_taken, 0);
    const passedTests = results.filter(r => r.percentage >= 60).length;

    return { totalTests, averageScore, totalTime, passedTests };
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Progress Dashboard</h1>
            <p className="text-muted-foreground">Track your learning journey</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                  <p className="text-sm text-muted-foreground">Tests Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatTime(stats.totalTime)}</p>
                  <p className="text-sm text-muted-foreground">Total Practice Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Award className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.passedTests}</p>
                  <p className="text-sm text-muted-foreground">Tests Passed (60%+)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Progress Over Time
                  </CardTitle>
                  <CardDescription>Your test scores across recent attempts</CardDescription>
                </CardHeader>
                <CardContent>
                  {progressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="test" className="text-muted-foreground" />
                        <YAxis domain={[0, 100]} className="text-muted-foreground" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value}%`,
                            `${props.payload.skill} - ${props.payload.level}`
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>Complete some tests to see your progress chart</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>Personalized tips for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Skill Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillAnalysis.map(skill => (
                <Card key={skill.skill}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      {skill.skill === 'reading' ? (
                        <BookOpen className="h-5 w-5 text-primary" />
                      ) : (
                        <Headphones className="h-5 w-5 text-primary" />
                      )}
                      {skill.skill}
                    </CardTitle>
                    <CardDescription>{skill.totalTests} tests completed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Score</span>
                      <span className="text-2xl font-bold">{skill.averageScore}%</span>
                    </div>
                    <Progress value={skill.averageScore} className="h-3" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Trend:</span>
                      <Badge variant={skill.trend === 'up' ? 'default' : skill.trend === 'down' ? 'destructive' : 'secondary'}>
                        {skill.trend === 'up' ? '↑ Improving' : skill.trend === 'down' ? '↓ Declining' : '→ Stable'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Test History</CardTitle>
                <CardDescription>All your completed tests</CardDescription>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-4">
                    {results.map(result => (
                      <div 
                        key={result.id} 
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${result.skill === 'reading' ? 'bg-primary/10' : 'bg-cyan-500/10'}`}>
                            {result.skill === 'reading' ? (
                              <BookOpen className="h-5 w-5 text-primary" />
                            ) : (
                              <Headphones className="h-5 w-5 text-cyan-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{result.skill} - {result.level}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.created_at).toLocaleDateString()} • {formatTime(result.time_taken)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${result.percentage >= 60 ? 'text-green-500' : 'text-destructive'}`}>
                            {result.percentage}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.correct_answers}/{result.total_questions} correct
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No tests completed yet. Start practicing!</p>
                    <Button className="mt-4" onClick={() => navigate('/')}>
                      Take a Test
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skill Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Distribution</CardTitle>
                  <CardDescription>Tests taken by skill type</CardDescription>
                </CardHeader>
                <CardContent>
                  {skillDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={skillDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {skillDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <p>No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Level Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Level</CardTitle>
                  <CardDescription>Average scores across CEFR levels</CardDescription>
                </CardHeader>
                <CardContent>
                  {levelDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={levelDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="level" className="text-muted-foreground" />
                        <YAxis domain={[0, 100]} className="text-muted-foreground" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value}%`, 'Avg Score']}
                        />
                        <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <p>No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Level Progress Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Level Progress</CardTitle>
                <CardDescription>Your performance at each CEFR level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {levelAnalysis.map(level => (
                    <div 
                      key={level.level}
                      className={`p-4 rounded-lg border text-center ${
                        level.recommended ? 'border-green-500 bg-green-500/10' : ''
                      }`}
                    >
                      <p className="text-2xl font-bold mb-1">{level.level}</p>
                      <p className="text-lg font-semibold text-primary">{level.averageScore}%</p>
                      <p className="text-xs text-muted-foreground">{level.testsCompleted} tests</p>
                      {level.recommended && (
                        <Badge variant="default" className="mt-2 text-xs">Mastered</Badge>
                      )}
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
