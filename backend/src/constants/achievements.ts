/**
 * Achievement Definitions
 * Static achievement configurations for the game
 */

export type AchievementRequirementType =
  | 'wins'
  | 'games_played'
  | 'win_streak'
  | 'night_win'
  | 'comeback'
  | 'perfect_streak'
  | 'score';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory = 'wins' | 'streaks' | 'games' | 'special' | 'score';

export interface AchievementDefinition {
  id: string;
  name: { en: string; vi: string };
  desc: { en: string; vi: string };
  icon: string;
  category: AchievementCategory;
  requirement: {
    type: AchievementRequirementType;
    value: number;
  };
  rarity: AchievementRarity;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // WINS CATEGORY
  {
    id: 'first-blood',
    name: { en: 'First Blood', vi: 'Chiến Thắng Đầu Tiên' },
    desc: { en: 'Win your first game', vi: 'Thắng ván đầu tiên' },
    icon: '🩸',
    category: 'wins',
    requirement: { type: 'wins', value: 1 },
    rarity: 'common',
  },
  {
    id: 'warrior',
    name: { en: 'Warrior', vi: 'Chiến Binh' },
    desc: { en: 'Win 10 games', vi: 'Thắng 10 ván' },
    icon: '⚔️',
    category: 'wins',
    requirement: { type: 'wins', value: 10 },
    rarity: 'common',
  },
  {
    id: 'champion',
    name: { en: 'Champion', vi: 'Nhà Vô Địch' },
    desc: { en: 'Win 50 games', vi: 'Thắng 50 ván' },
    icon: '🏆',
    category: 'wins',
    requirement: { type: 'wins', value: 50 },
    rarity: 'rare',
  },
  {
    id: 'legend',
    name: { en: 'Legend', vi: 'Huyền Thoại' },
    desc: { en: 'Win 100 games', vi: 'Thắng 100 ván' },
    icon: '👑',
    category: 'wins',
    requirement: { type: 'wins', value: 100 },
    rarity: 'epic',
  },
  {
    id: 'immortal',
    name: { en: 'Immortal', vi: 'Bất Tử' },
    desc: { en: 'Win 500 games', vi: 'Thắng 500 ván' },
    icon: '🌟',
    category: 'wins',
    requirement: { type: 'wins', value: 500 },
    rarity: 'legendary',
  },

  // STREAKS CATEGORY
  {
    id: 'on-fire',
    name: { en: 'On Fire', vi: 'Đang Nóng' },
    desc: { en: '3 win streak', vi: 'Chuỗi 3 trận thắng' },
    icon: '🔥',
    category: 'streaks',
    requirement: { type: 'win_streak', value: 3 },
    rarity: 'common',
  },
  {
    id: 'unstoppable',
    name: { en: 'Unstoppable', vi: 'Không Thể Cản' },
    desc: { en: '5 win streak', vi: 'Chuỗi 5 trận thắng' },
    icon: '💪',
    category: 'streaks',
    requirement: { type: 'win_streak', value: 5 },
    rarity: 'rare',
  },
  {
    id: 'godlike',
    name: { en: 'Godlike', vi: 'Thần Thánh' },
    desc: { en: '10 win streak', vi: 'Chuỗi 10 trận thắng' },
    icon: '⚡',
    category: 'streaks',
    requirement: { type: 'win_streak', value: 10 },
    rarity: 'epic',
  },
  {
    id: 'invincible',
    name: { en: 'Invincible', vi: 'Bất Bại' },
    desc: { en: '15 win streak', vi: 'Chuỗi 15 trận thắng' },
    icon: '🛡️',
    category: 'streaks',
    requirement: { type: 'win_streak', value: 15 },
    rarity: 'legendary',
  },

  // GAMES PLAYED CATEGORY
  {
    id: 'newcomer',
    name: { en: 'Newcomer', vi: 'Người Mới' },
    desc: { en: 'Play your first game', vi: 'Chơi ván đầu tiên' },
    icon: '🎮',
    category: 'games',
    requirement: { type: 'games_played', value: 1 },
    rarity: 'common',
  },
  {
    id: 'regular',
    name: { en: 'Regular', vi: 'Thường Xuyên' },
    desc: { en: 'Play 50 games', vi: 'Chơi 50 ván' },
    icon: '🎯',
    category: 'games',
    requirement: { type: 'games_played', value: 50 },
    rarity: 'rare',
  },
  {
    id: 'veteran',
    name: { en: 'Veteran', vi: 'Cựu Binh' },
    desc: { en: 'Play 200 games', vi: 'Chơi 200 ván' },
    icon: '🎖️',
    category: 'games',
    requirement: { type: 'games_played', value: 200 },
    rarity: 'epic',
  },
  {
    id: 'dedicated',
    name: { en: 'Dedicated', vi: 'Tận Tụy' },
    desc: { en: 'Play 500 games', vi: 'Chơi 500 ván' },
    icon: '💎',
    category: 'games',
    requirement: { type: 'games_played', value: 500 },
    rarity: 'legendary',
  },

  // SCORE CATEGORY
  {
    id: 'rising-star',
    name: { en: 'Rising Star', vi: 'Ngôi Sao Mới' },
    desc: { en: 'Reach 100 score', vi: 'Đạt 100 điểm' },
    icon: '⭐',
    category: 'score',
    requirement: { type: 'score', value: 100 },
    rarity: 'common',
  },
  {
    id: 'gold-player',
    name: { en: 'Gold Player', vi: 'Người Chơi Vàng' },
    desc: { en: 'Reach 500 score', vi: 'Đạt 500 điểm' },
    icon: '🥇',
    category: 'score',
    requirement: { type: 'score', value: 500 },
    rarity: 'rare',
  },
  {
    id: 'elite',
    name: { en: 'Elite', vi: 'Tinh Hoa' },
    desc: { en: 'Reach 1000 score', vi: 'Đạt 1000 điểm' },
    icon: '💠',
    category: 'score',
    requirement: { type: 'score', value: 1000 },
    rarity: 'epic',
  },
  {
    id: 'grandmaster',
    name: { en: 'Grandmaster', vi: 'Đại Kiện Tướng' },
    desc: { en: 'Reach 2000 score', vi: 'Đạt 2000 điểm' },
    icon: '🏅',
    category: 'score',
    requirement: { type: 'score', value: 2000 },
    rarity: 'legendary',
  },

  // SPECIAL CATEGORY
  {
    id: 'night-owl',
    name: { en: 'Night Owl', vi: 'Cú Đêm' },
    desc: { en: 'Win a game after midnight', vi: 'Thắng sau 12 giờ đêm' },
    icon: '🦉',
    category: 'special',
    requirement: { type: 'night_win', value: 1 },
    rarity: 'rare',
  },
  {
    id: 'comeback-king',
    name: { en: 'Comeback King', vi: 'Vua Lội Ngược' },
    desc: { en: 'Win after being down 0-2', vi: 'Thắng sau khi thua 0-2' },
    icon: '👊',
    category: 'special',
    requirement: { type: 'comeback', value: 1 },
    rarity: 'epic',
  },
];

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find((a) => a.id === id);
};

export const getAchievementsByCategory = (category: AchievementCategory): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter((a) => a.category === category);
};

export const getAchievementsByRarity = (rarity: AchievementRarity): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter((a) => a.rarity === rarity);
};
