import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => (
  <main className="container mx-auto px-4 py-6 sm:py-8">
    {/* Top bar */}
    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-10 w-52 rounded-xl hidden md:block" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>

    {/* Hero + AI Coach */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
      <Card className="xl:col-span-2 border-border/60">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-28 w-32 rounded-2xl" />
          </div>
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
            <Skeleton className="h-12 flex-1" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Quick actions */}
    <Skeleton className="h-16 w-full rounded-xl mb-5" />

    {/* Mission / Weekly / XP / Leaderboard */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>

    {/* Continue Learning / Achievements / Study Time */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  </main>
);
