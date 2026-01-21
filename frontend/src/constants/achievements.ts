/**
 * Achievement Definitions for Frontend
 * Mirror of backend achievements for display purposes
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'wins' | 'streaks' | 'games' | 'special' | 'score';

export interface AchievementDefinition {
  id: string;
  name: { en: string; vi: string };
  desc: { en: string; vi: string };
  icon: string;
  category: AchievementCategory;
  requirement: {
    type: string;
    value: number;
  };
  rarity: AchievementRarity;
}

export interface UnlockedAchievement extends AchievementDefinition {
  unlockedAt: string;
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export const RARITY_BG_COLORS: Record<AchievementRarity, string> = {
  common: 'rgba(156, 163, 175, 0.1)',
  rare: 'rgba(59, 130, 246, 0.1)',
  epic: 'rgba(139, 92, 246, 0.1)',
  legendary: 'rgba(245, 158, 11, 0.1)',
};

export const RARITY_NAMES: Record<AchievementRarity, { en: string; vi: string }> = {
  common: { en: 'Common', vi: 'Phổ thông' },
  rare: { en: 'Rare', vi: 'Hiếm' },
  epic: { en: 'Epic', vi: 'Sử thi' },
  legendary: { en: 'Legendary', vi: 'Huyền thoại' },
};

export const CATEGORY_NAMES: Record<AchievementCategory, { en: string; vi: string }> = {
  wins: { en: 'Wins', vi: 'Chiến thắng' },
  streaks: { en: 'Streaks', vi: 'Chuỗi' },
  games: { en: 'Games Played', vi: 'Số ván' },
  special: { en: 'Special', vi: 'Đặc biệt' },
  score: { en: 'Score', vi: 'Điểm số' },
};
