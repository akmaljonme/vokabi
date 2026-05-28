import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Eye, Gamepad2, PenTool } from "lucide-react";

const EVENTS = [
  { key: "page_view",      label: "Sahifa ko'rishlar",  icon: Eye,       color: "text-blue-500",   bg: "bg-blue-500/10" },
  { key: "test_started",   label: "Test boshlangan",    icon: BarChart3, color: "text-green-500",  bg: "bg-green-500/10" },
  { key: "test_completed", label: "Test yakunlangan",   icon: TrendingUp,color: "text-purple-500", bg: "bg-purple-500/10" },
  { key: "game_played",    label: "O'yin o'ynalgan",    icon: Gamepad2,  color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "essay_checked",  label: "Essay tekshirilgan", icon: PenTool,   color: "text-pink-500",   bg: "bg-pink-500/10" },
  { key: "login",          label: "Loginlar",           icon: Users,     color: "text-yellow-500", bg: "bg-yellow-500/10" },
];

export const AnalyticsTab = () => {
  const stats = useMemo(() => {
    return EVENTS.map(e => ({
      ...e,
      count: parseInt(localStorage.getItem(`vokabi_analytics_${e.key}`) || "0"),
    }));
  }, []);

  const total = stats.reduce((a, b) => a + b.count, 0);
  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Analytics</h2>
        <span className="text-sm text-muted-foreground">Jami {total} ta hodisa</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.key}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="card-elevated rounded-2xl p-5 border border-border/40"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card-elevated rounded-2xl p-6 border border-border/40">
        <h3 className="font-semibold mb-5">Hodisalar taqsimoti</h3>
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 truncate">{s.label}</span>
              <div className="flex-1 h-7 bg-muted/30 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-lg flex items-center justify-end pr-2 ${s.bg}`}
                  style={{ minWidth: s.count > 0 ? "2rem" : 0 }}
                >
                  {s.count > 0 && <span className={`text-xs font-bold ${s.color}`}>{s.count}</span>}
                </motion.div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">* Bu brauzer localStorage dan olingan ma'lumotlar</p>
      </div>
    </div>
  );
};
