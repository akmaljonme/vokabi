import { useMemo } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapProps {
  results: { created_at: string; score: number }[];
}

export const ProgressHeatmap = ({ results }: HeatmapProps) => {
  const weeks = 26; // 6 oy
  const today = new Date();

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    results.forEach(r => {
      const d = new Date(r.created_at).toISOString().split("T")[0];
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [results]);

  const days = useMemo(() => {
    const arr = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      arr.push({ date: key, count: activityMap[key] || 0, label: d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }) });
    }
    return arr;
  }, [activityMap]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/40";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/55";
    if (count === 3) return "bg-primary/75";
    return "bg-primary";
  };

  const totalDays = days.filter(d => d.count > 0).length;
  const streak = useMemo(() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) s++;
      else if (i < days.length - 1) break;
    }
    return s;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    days.forEach((d, i) => {
      const month = new Date(d.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ label: new Date(d.date).toLocaleDateString("uz-UZ", { month: "short" }), col: Math.floor(i / 7) });
        lastMonth = month;
      }
    });
    return labels;
  }, [days]);

  const grid = Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-display font-bold text-base">Faollik xaritasi</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>🔥 {streak} kunlik streak</span>
          <span>📅 {totalDays} faol kun</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="relative overflow-x-auto pb-2">
        <div className="flex gap-1 mb-1 pl-0" style={{ minWidth: weeks * 14 }}>
          {monthLabels.map((m, i) => (
            <div key={i} className="absolute text-[10px] text-muted-foreground" style={{ left: m.col * 14 }}>
              {m.label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1 mt-5" style={{ minWidth: weeks * 14 }}>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <Tooltip key={di}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.002, duration: 0.2 }}
                      className={`w-3 h-3 rounded-[2px] cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all ${getColor(day.count)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{day.label}</p>
                    <p>{day.count > 0 ? `${day.count} ta test` : "Faollik yo'q"}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Kam</span>
        {["bg-muted/40", "bg-primary/30", "bg-primary/55", "bg-primary/75", "bg-primary"].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
        ))}
        <span>Ko'p</span>
      </div>
    </div>
  );
};
