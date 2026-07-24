import { useEffect, useState } from "react";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { Loader2, TrendingUp, Users, Wallet, ClipboardCheck, Download } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar,
} from "recharts";
import { exportToCSV } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";
import { StatCard } from "./StatCard";

const DAYS_RANGE = 30;

function lastNDays(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const fmtDay = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export const ReportsTab = () => {
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<{ day: string; users: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ day: string; revenue: number }[]>([]);
  const [testsData, setTestsData] = useState<{ day: string; tests: number }[]>([]);
  const [totals, setTotals] = useState({ newUsers: 0, revenue: 0, tests: 0, activeUsers: 0 });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - DAYS_RANGE);
      const sinceISO = since.toISOString();
      const days = lastNDays(DAYS_RANGE);
      const dayIndex = new Map(days.map((d, i) => [d, i]));

      // 1) Foydalanuvchilar o'sishi
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at, last_seen_at")
        .gte("created_at", sinceISO);

      const growthBuckets = new Array(DAYS_RANGE).fill(0);
      (profiles || []).forEach((p: any) => {
        const day = p.created_at?.slice(0, 10);
        if (dayIndex.has(day)) growthBuckets[dayIndex.get(day)!]++;
      });

      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // 2) Daromad (tasdiqlangan to'lovlar)
      const { data: payments } = await (supabase.from("payment_requests") as any)
        .select("amount, created_at, status")
        .eq("status", "approved")
        .gte("created_at", sinceISO);

      const revenueBuckets = new Array(DAYS_RANGE).fill(0);
      (payments || []).forEach((p: any) => {
        const day = p.created_at?.slice(0, 10);
        if (dayIndex.has(day)) revenueBuckets[dayIndex.get(day)!] += Number(p.amount || 0);
      });

      // 3) Test faolligi
      const { data: tests } = await supabase
        .from("test_results")
        .select("created_at")
        .gte("created_at", sinceISO);

      const testsBuckets = new Array(DAYS_RANGE).fill(0);
      (tests || []).forEach((t: any) => {
        const day = t.created_at?.slice(0, 10);
        if (dayIndex.has(day)) testsBuckets[dayIndex.get(day)!]++;
      });

      setGrowthData(days.map((d, i) => ({ day: fmtDay(d), users: growthBuckets[i] })));
      setRevenueData(days.map((d, i) => ({ day: fmtDay(d), revenue: revenueBuckets[i] })));
      setTestsData(days.map((d, i) => ({ day: fmtDay(d), tests: testsBuckets[i] })));
      setTotals({
        newUsers: growthBuckets.reduce((a, b) => a + b, 0),
        revenue: revenueBuckets.reduce((a, b) => a + b, 0),
        tests: testsBuckets.reduce((a, b) => a + b, 0),
        activeUsers: activeUsers || 0,
      });
    } catch (err) {
      console.error("Hisobot yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportAll = () => {
    const rows = growthData.map((g, i) => ({
      "Sana": g.day,
      "Yangi foydalanuvchilar": g.users,
      "Daromad (so'm)": revenueData[i]?.revenue || 0,
      "Yechilgan testlar": testsData[i]?.tests || 0,
    }));
    exportToCSV(`vokabi_hisobot_${DAYS_RANGE}kun`, rows);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Hisobotlar
          </h2>
          <p className="text-muted-foreground text-sm">Oxirgi {DAYS_RANGE} kunlik statistik ko'rsatkichlar</p>
        </div>
        <Button variant="outline" onClick={exportAll}>
          <Download className="w-4 h-4 mr-2" /> CSV eksport
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Yangi foydalanuvchilar" value={totals.newUsers} icon={Users} />
        <StatCard title="Faol (7 kun)" value={totals.activeUsers} icon={Users} />
        <StatCard title="Daromad (so'm)" value={totals.revenue.toLocaleString('uz-UZ')} icon={Wallet} />
        <StatCard title="Yechilgan testlar" value={totals.tests} icon={ClipboardCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Foydalanuvchilar o'sishi</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#userGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Daromad (so'm)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Test faolligi (kuniga yechilgan testlar)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={testsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="tests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
