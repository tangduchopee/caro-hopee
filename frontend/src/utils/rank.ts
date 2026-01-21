/**
 * Rank/Level system utilities
 * Calculates user rank based on totalScore from GameStats
 */

export interface Rank {
  id: string;
  name: {
    en: string;
    vi: string;
  };
  min: number;
  max: number;
  icon: string;
  color: string;
}

export const RANKS: Rank[] = [
  { id: 'bronze', name: { en: 'Bronze', vi: 'Đồng' }, min: 0, max: 99, icon: '🥉', color: '#CD7F32' },
  { id: 'silver', name: { en: 'Silver', vi: 'Bạc' }, min: 100, max: 299, icon: '🥈', color: '#C0C0C0' },
  { id: 'gold', name: { en: 'Gold', vi: 'Vàng' }, min: 300, max: 599, icon: '🥇', color: '#FFD700' },
  { id: 'platinum', name: { en: 'Platinum', vi: 'Bạch kim' }, min: 600, max: 999, icon: '💎', color: '#E5E4E2' },
  { id: 'diamond', name: { en: 'Diamond', vi: 'Kim cương' }, min: 1000, max: 1499, icon: '💠', color: '#B9F2FF' },
  { id: 'master', name: { en: 'Master', vi: 'Cao thủ' }, min: 1500, max: 2499, icon: '👑', color: '#FF4500' },
  { id: 'grandmaster', name: { en: 'Grandmaster', vi: 'Đại cao thủ' }, min: 2500, max: Infinity, icon: '🏆', color: '#9333EA' },
];

/**
 * Get rank for a given totalScore
 */
export const getRank = (totalScore: number): Rank => {
  return RANKS.find(r => totalScore >= r.min && totalScore <= r.max) || RANKS[0];
};

/**
 * Get the next rank after current rank
 */
export const getNextRank = (currentRank: Rank): Rank | null => {
  const currentIndex = RANKS.findIndex(r => r.id === currentRank.id);
  if (currentIndex === -1 || currentIndex === RANKS.length - 1) {
    return null; // Already at max rank
  }
  return RANKS[currentIndex + 1];
};

/**
 * Calculate progress percentage towards next rank
 * Returns 100 if at max rank
 */
export const getRankProgress = (totalScore: number): number => {
  const rank = getRank(totalScore);
  const nextRank = getNextRank(rank);

  if (!nextRank) {
    return 100; // Max rank reached
  }

  const rangeSize = rank.max - rank.min + 1;
  const scoreInRange = totalScore - rank.min;
  const progress = (scoreInRange / rangeSize) * 100;

  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Get points needed to reach next rank
 */
export const getPointsToNextRank = (totalScore: number): number | null => {
  const rank = getRank(totalScore);
  const nextRank = getNextRank(rank);

  if (!nextRank) {
    return null; // Already at max rank
  }

  return nextRank.min - totalScore;
};

/**
 * Get rank index (0-based) for sorting/comparison
 */
export const getRankIndex = (totalScore: number): number => {
  const rank = getRank(totalScore);
  return RANKS.findIndex(r => r.id === rank.id);
};
