import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays } from 'lucide-react';

interface StudyHeatmapProps {
  results: { created_at: string }[];
}

export const StudyHeatmap = ({ results }: StudyHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days: { date: string; count: number; dayOfWeek: number }[] = [];

    // Last 20 weeks (140 days)
    for (let i = 139; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = results.filter(r => r.created_at.startsWith(dateStr)).length;
      days.push({ date: dateStr, count, dayOfWeek: d.getDay() });
    }

    // Group into weeks
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];
    days.forEach((day) => {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { days, weeks };
  }, [results]);

  const maxCount = Math.max(1, ...heatmapData.days.map(d => d.count));

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/60';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-primary/20';
    if (intensity <= 0.5) return 'bg-primary/40';
    if (intensity <= 0.75) return 'bg-primary/60';
    return 'bg-primary';
  };

  const totalActive = heatmapData.days.filter(d => d.count > 0).length;
  const totalTests = heatmapData.days.reduce((s, d) => s + d.count, 0);

  const months = useMemo(() => {
    const m: { label: string; col: number }[] = [];
    let lastMonth = -1;
    heatmapData.weeks.forEach((week, wi) => {
      const firstDay = week[0];
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        m.push({ label: new Date(firstDay.date).toLocaleString('uz', { month: 'short' }), col: wi });
        lastMonth = month;
      }
    });
    return m;
  }, [heatmapData.weeks]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> O'quv faollik xaritasi
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {totalActive} kun faol • {totalTests} test
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-8 mb-1">
            {months.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground"
                style={{ position: 'relative', left: `${m.col * 15}px` }}
              >
                {i === 0 || months[i - 1].col < m.col - 1 ? m.label : ''}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground pr-1">
              {['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'].map((d, i) => (
                <div key={i} className="h-[12px] flex items-center">{i % 2 === 1 ? d : ''}</div>
              ))}
            </div>

            {/* Grid */}
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-[3px]">
                {heatmapData.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {/* Pad first week */}
                    {wi === 0 && Array.from({ length: week[0].dayOfWeek }, (_, i) => (
                      <div key={`pad-${i}`} className="w-[12px] h-[12px]" />
                    ))}
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-[12px] h-[12px] rounded-[2px] ${getColor(day.count)} transition-colors hover:ring-1 hover:ring-foreground/20 cursor-default`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{day.count} ta test</p>
                          <p className="text-muted-foreground">{new Date(day.date).toLocaleDateString('uz', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-muted-foreground">Kam</span>
            {['bg-muted/60', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary'].map((c, i) => (
              <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">Ko'p</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
