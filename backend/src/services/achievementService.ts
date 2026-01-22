/**
 * Achievement Service
 * Handles achievement checking and awarding logic
 */
import UserAchievement from '../models/UserAchievement';
import { ACHIEVEMENTS, AchievementDefinition } from '../constants/achievements';
import { IGameStats } from '../models/GameStats';

export interface GameContext {
  isNightGame?: boolean; // Game finished between 00:00-05:00
  wasComeback?: boolean; // Won after being down 0-2
  gameId?: string;
}

export interface AchievementCheckResult {
  newlyUnlocked: string[];
  achievements: AchievementDefinition[];
}

/**
 * Check and award achievements based on user stats
 */
export async function checkAndAwardAchievements(
  userId: string,
  stats: IGameStats,
  gameContext?: GameContext
): Promise<AchievementCheckResult> {
  const gameId = gameContext?.gameId || 'caro';

  // Get existing achievements for this user and game
  const existing = await UserAchievement.find({ userId, gameId }).select('achievementId');
  const existingIds = new Set(existing.map((a) => a.achievementId));

  const newlyUnlocked: string[] = [];
  const unlockedAchievements: AchievementDefinition[] = [];
  const totalGames = stats.wins + stats.losses + stats.draws;

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (existingIds.has(achievement.id)) continue;

    let qualified = false;

    switch (achievement.requirement.type) {
      case 'wins':
        qualified = stats.wins >= achievement.requirement.value;
        break;

      case 'games_played':
        qualified = totalGames >= achievement.requirement.value;
        break;

      case 'win_streak':
        qualified = stats.streaks.bestWin >= achievement.requirement.value;
        break;

      case 'score':
        qualified = stats.totalScore >= achievement.requirement.value;
        break;

      case 'night_win':
        qualified = gameContext?.isNightGame === true;
        break;

      case 'comeback':
        qualified = gameContext?.wasComeback === true;
        break;

      default:
        break;
    }

    if (qualified) {
      newlyUnlocked.push(achievement.id);
      unlockedAchievements.push(achievement);
    }
  }

  // FIX B2: Batch insert all achievements in single query instead of N sequential writes
  // This eliminates N+1 writes that block game finish events
  if (newlyUnlocked.length > 0) {
    try {
      const achievementsToInsert = newlyUnlocked.map((achievementId) => ({
        userId,
        achievementId,
        gameId,
      }));
      // Use insertMany with ordered: false to continue on duplicate key errors
      await UserAchievement.insertMany(achievementsToInsert, { ordered: false });
    } catch (error: any) {
      // Handle bulk write errors (some may have duplicate key errors)
      if (error.code !== 11000 && !error.writeErrors) {
        console.error('Failed to batch award achievements:', error);
      }
      // If there are write errors, filter out successfully inserted achievements
      // For now, we keep the list as-is since the duplicate key errors just mean
      // those achievements were already unlocked (race condition)
    }
  }

  return {
    newlyUnlocked,
    achievements: unlockedAchievements,
  };
}

/**
 * Get user's achievements with details
 */
export async function getUserAchievements(
  userId: string,
  gameId = 'caro'
): Promise<{
  unlocked: Array<AchievementDefinition & { unlockedAt: Date }>;
  locked: AchievementDefinition[];
  total: number;
  unlockedCount: number;
}> {
  // FIX HIGH-1: Add .limit() and .lean() to prevent unbounded query
  const userAchievements = await UserAchievement.find({ userId, gameId })
    .sort({ unlockedAt: -1 })
    .limit(100) // Reasonable limit - most users won't have 100+ achievements
    .lean();
  const unlockedIds = new Set(userAchievements.map((a) => a.achievementId));

  const unlocked: Array<AchievementDefinition & { unlockedAt: Date }> = [];
  const locked: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);
    if (userAchievement) {
      unlocked.push({
        ...achievement,
        unlockedAt: userAchievement.unlockedAt,
      });
    } else {
      locked.push(achievement);
    }
  }

  return {
    unlocked,
    locked,
    total: ACHIEVEMENTS.length,
    unlockedCount: unlocked.length,
  };
}

/**
 * Check if it's night time (00:00-05:00)
 */
export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour < 5;
}

/**
 * Get all achievement definitions
 */
export function getAllAchievements(): AchievementDefinition[] {
  return ACHIEVEMENTS;
}
