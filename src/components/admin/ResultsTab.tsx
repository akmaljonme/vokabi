import { useState, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { format } from 'date-fns';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface TestResult {
  id: string;
  user_id: string;
  user_name: string;
  level: string;
  skill: string;
  percentage: number;
  passed: boolean;
  time_taken: number;
  created_at: string;
}

const COLORS = ['#22c55e', '#ef4444'];

export const ResultsTab = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names
      const resultsWithNames = await Promise.all(
        (data || []).map(async (result) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', result.user_id)
            .single();

          return {
            ...result,
            user_name: profile?.full_name || 'Unknown User'
          };
        })
      );

      setResults(resultsWithNames);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['User', 'Level', 'Skill', 'Score', 'Passed', 'Time (min)', 'Date'];
    const rows = filteredResults.map(r => [
      r.user_name,
      r.level,
      r.skill,
      `${r.percentage}%`,
      r.passed ? 'Yes' : 'No',
      Math.round(r.time_taken / 60),
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredResults = results.filter(r => {
    if (filterLevel !== 'all' && r.level !== filterLevel) return false;
    if (filterSkill !== 'all' && r.skill !== filterSkill) return false;
    return true;
  });

  // Stats calculations
  const passRate = filteredResults.length 
    ? Math.round((filteredResults.filter(r => r.passed).length / filteredResults.length) * 100)
    : 0;

  const passFailData = [
    { name: 'Passed', value: filteredResults.filter(r => r.passed).length },
    { name: 'Failed', value: filteredResults.filter(r => !r.passed).length }
  ];

  const skillPerformance = ['reading', 'listening'].map(skill => ({
    skill: skill.charAt(0).toUpperCase() + skill.slice(1),
    avgScore: Math.round(
      filteredResults
        .filter(r => r.skill === skill)
        .reduce((acc, r) => acc + r.percentage, 0) / 
      (filteredResults.filter(r => r.skill === skill).length || 1)
    )
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Results & Analytics</h2>
          <p className="text-muted-foreground">{filteredResults.length} test results</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="A1">A1</SelectItem>
              <SelectItem value="A2">A2</SelectItem>
              <SelectItem value="B1">B1</SelectItem>
              <SelectItem value="B2">B2</SelectItem>
              <SelectItem value="C1">C1</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSkill} onValueChange={setFilterSkill}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="listening">Listening</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Pass Rate</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passFailData}
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {passFailData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-3xl font-bold">{passRate}%</p>
              <p className="text-sm text-muted-foreground">Overall Pass Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Skill Performance</h3>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillPerformance} layout="vertical">
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="skill" width={70} fontSize={12} />
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Score</span>
              <span className="font-semibold">
                {Math.round(filteredResults.reduce((a, r) => a + r.percentage, 0) / (filteredResults.length || 1))}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tests</span>
              <span className="font-semibold">{filteredResults.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Time</span>
              <span className="font-semibold">
                {Math.round(filteredResults.reduce((a, r) => a + r.time_taken, 0) / (filteredResults.length || 1) / 60)} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Test</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Score</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Time</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.slice(0, 20).map((result) => (
                <tr key={result.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm">{result.user_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium bg-level-${result.level.toLowerCase()}/20 text-level-${result.level.toLowerCase()}`}>
                        {result.level}
                      </span>
                      <span className="text-sm capitalize">{result.skill}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={result.percentage >= 60 ? 'text-green-500 font-medium' : 'text-destructive font-medium'}>
                      {result.percentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.passed 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {result.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {Math.round(result.time_taken / 60)} min
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {format(new Date(result.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No results found
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
