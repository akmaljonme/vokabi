import { useState, useEffect } from 'react';
import { Users, FileCheck, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from './StatCard';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface DailyStats {
  date: string;
  tests: number;
  users: number;
}

interface RecentActivity {
  id: string;
  user_email: string;
  level: string;
  skill: string;
  percentage: number;
  created_at: string;
}

export const OverviewTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    testsToday: 0,
    avgScore: 0
  });
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<{ level: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch today's tests
      const today = startOfDay(new Date()).toISOString();
      const { data: todayTests } = await supabase
        .from('test_results')
        .select('*')
        .gte('created_at', today);

      // Fetch all test results for average score
      const { data: allResults } = await supabase
        .from('test_results')
        .select('percentage');

      const avgScore = allResults?.length 
        ? Math.round(allResults.reduce((acc, r) => acc + r.percentage, 0) / allResults.length)
        : 0;

      // Unique users today
      const activeToday = new Set(todayTests?.map(t => t.user_id)).size;

      setStats({
        totalUsers: totalUsers || 0,
        activeToday,
        testsToday: todayTests?.length || 0,
        avgScore
      });

      // Fetch daily stats for chart (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = startOfDay(subDays(date, -1)).toISOString();

        const { data: dayTests } = await supabase
          .from('test_results')
          .select('user_id')
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);

        last7Days.push({
          date: format(date, 'EEE'),
          tests: dayTests?.length || 0,
          users: new Set(dayTests?.map(t => t.user_id)).size
        });
      }
      setDailyData(last7Days);

      // Fetch recent activity
      const { data: recent } = await supabase
        .from('test_results')
        .select('id, level, skill, percentage, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent) {
        const activityWithEmails = await Promise.all(
          recent.map(async (r) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', r.user_id)
              .single();
            
            return {
              ...r,
              user_email: profile?.full_name || 'Unknown User'
            };
          })
        );
        setRecentActivity(activityWithEmails);
      }

      // Level distribution
      const { data: levelData } = await supabase
        .from('test_results')
        .select('level');

      if (levelData) {
        const distribution = ['A1', 'A2', 'B1', 'B2', 'C1'].map(level => ({
          level,
          count: levelData.filter(d => d.level === level).length
        }));
        setLevelDistribution(distribution);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Active Today"
          value={stats.activeToday}
          change="Currently online"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          title="Tests Today"
          value={stats.testsToday}
          change="+8% from yesterday"
          changeType="positive"
          icon={FileCheck}
        />
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}%`}
          change="Across all tests"
          changeType="neutral"
          icon={Award}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tests" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Tests"
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))' }}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level Distribution */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Tests by Level</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="level" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Tests"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Test</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="border-b border-border last:border-0">
                  <td className="py-3 px-4 text-sm">{activity.user_email}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium bg-level-${activity.level.toLowerCase()}/20 text-level-${activity.level.toLowerCase()}`}>
                        {activity.level}
                      </span>
                      {activity.skill}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={activity.percentage >= 60 ? 'text-green-500' : 'text-destructive'}>
                      {activity.percentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </td>
                </tr>
              ))}
              {recentActivity.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
