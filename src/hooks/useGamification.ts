import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProgress {
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  tests_completed: number;
  total_study_time: number;
  last_activity_date: string | null;
}

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  threshold: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  current_streak: number;
}

const XP_PER_LEVEL = 500;
const XP_PER_TEST = 25;
const XP_PER_CORRECT = 5;
const XP_STREAK_BONUS = 10;

export const useGamification = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    
    try {
      // Fetch progress
      const { data: prog } = await supabase
        .from('user_progress' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prog) {
        // Create initial progress
        const { data: newProg } = await supabase
          .from('user_progress' as any)
          .insert({ user_id: user.id } as any)
          .select()
          .single();
        setProgress(newProg as any);
      } else {
        setProgress(prog as any);
      }

      // Fetch achievements
      const { data: achs } = await supabase
        .from('achievements' as any)
        .select('*');
      if (achs) setAchievements(achs as any[]);

      // Fetch user achievements
      const { data: uachs } = await supabase
        .from('user_achievements' as any)
        .select('*')
        .eq('user_id', user.id);
      if (uachs) setUserAchievements(uachs as any[]);

      // Fetch leaderboard
      const { data: lb } = await supabase.rpc('get_leaderboard', { limit_count: 20 });
      if (lb) setLeaderboard(lb as any[]);
    } catch (err) {
      console.error('Gamification fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addXP = useCallback(async (amount: number) => {
    if (!user || !progress) return;
    const newXP = progress.xp + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    
    // Streak logic
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = progress.current_streak;
    let newLongest = progress.longest_streak;

    if (progress.last_activity_date !== today) {
      if (progress.last_activity_date === yesterday) {
        newStreak += 1;
      } else if (!progress.last_activity_date) {
        newStreak = 1;
      } else {
        newStreak = 1; // streak broken
      }
      newLongest = Math.max(newLongest, newStreak);
    }

    const updates = {
      xp: newXP,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
      tests_completed: progress.tests_completed + 1,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('user_progress' as any)
      .update(updates as any)
      .eq('user_id', user.id);

    setProgress(prev => prev ? { ...prev, ...updates } : null);
    return { newXP: amount, newLevel, leveledUp: newLevel > progress.level, newStreak };
  }, [user, progress]);

  const checkAndUnlockAchievements = useCallback(async (context: {
    testsCompleted?: number;
    streak?: number;
    level?: number;
    percentage?: number;
    skillsUsed?: string[];
    timeTaken?: number;
    timeLimit?: number;
  }) => {
    if (!user) return;
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const newlyUnlocked: Achievement[] = [];

    for (const ach of achievements) {
      if (unlockedIds.has(ach.id)) continue;

      let shouldUnlock = false;
      switch (ach.key) {
        case 'first_test': shouldUnlock = (context.testsCompleted || 0) >= 1; break;
        case 'tests_5': shouldUnlock = (context.testsCompleted || 0) >= 5; break;
        case 'tests_25': shouldUnlock = (context.testsCompleted || 0) >= 25; break;
        case 'tests_100': shouldUnlock = (context.testsCompleted || 0) >= 100; break;
        case 'streak_3': shouldUnlock = (context.streak || 0) >= 3; break;
        case 'streak_7': shouldUnlock = (context.streak || 0) >= 7; break;
        case 'streak_30': shouldUnlock = (context.streak || 0) >= 30; break;
        case 'level_5': shouldUnlock = (context.level || 0) >= 5; break;
        case 'level_10': shouldUnlock = (context.level || 0) >= 10; break;
        case 'perfect_score': shouldUnlock = (context.percentage || 0) >= 100; break;
        case 'speed_demon': 
          shouldUnlock = !!(context.timeTaken && context.timeLimit && context.timeTaken < context.timeLimit / 2);
          break;
        case 'all_skills': shouldUnlock = (context.skillsUsed?.length || 0) >= 4; break;
      }

      if (shouldUnlock) {
        const { error } = await supabase
          .from('user_achievements' as any)
          .insert({ user_id: user.id, achievement_id: ach.id } as any);
        
        if (!error) {
          newlyUnlocked.push(ach);
          // Award XP
          if (progress) {
            await supabase
              .from('user_progress' as any)
              .update({ xp: progress.xp + ach.xp_reward } as any)
              .eq('user_id', user.id);
          }
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      setNewAchievement(newlyUnlocked[0]);
      setUserAchievements(prev => [
        ...prev,
        ...newlyUnlocked.map(a => ({ achievement_id: a.id, unlocked_at: new Date().toISOString() }))
      ]);
    }

    return newlyUnlocked;
  }, [user, achievements, userAchievements, progress]);

  const dismissAchievement = () => setNewAchievement(null);

  const xpToNextLevel = progress ? (XP_PER_LEVEL - (progress.xp % XP_PER_LEVEL)) : 0;
  const xpProgress = progress ? ((progress.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 : 0;
  const userRank = leaderboard.findIndex(l => l.user_id === user?.id) + 1;

  return {
    progress, achievements, userAchievements, leaderboard, loading,
    addXP, checkAndUnlockAchievements, newAchievement, dismissAchievement,
    xpToNextLevel, xpProgress, userRank,
    XP_PER_TEST, XP_PER_CORRECT, XP_STREAK_BONUS,
  };
};
