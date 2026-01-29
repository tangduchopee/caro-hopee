/**
 * Xì Dách Score Tracker - LocalStorage Service
 * Handles persistence and score calculations
 */

import {
  XiDachSession,
  XiDachPlayer,
  XiDachPlayerResult,
  XiDachSettings,
  XiDachSettlement,
  XiDachStorageData,
  DEFAULT_XI_DACH_SETTINGS,
} from '../types/xi-dach-score.types';

// ============== CONSTANTS ==============

const STORAGE_KEY = 'xi-dach-sessions';
const STORAGE_VERSION = 1;

// ============== HELPERS ==============

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get current ISO timestamp
 */
export const getTimestamp = (): string => {
  return new Date().toISOString();
};

// ============== STORAGE CRUD ==============

/**
 * Get all sessions from localStorage
 */
export const getAllSessions = (): XiDachSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed: XiDachStorageData = JSON.parse(data);

    // Version check - can add migration logic here if needed
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('[XiDachStorage] Version mismatch, may need migration');
    }

    return parsed.sessions || [];
  } catch (error) {
    console.error('[XiDachStorage] Error reading sessions:', error);
    return [];
  }
};

/**
 * Get single session by ID
 */
export const getSession = (id: string): XiDachSession | null => {
  const sessions = getAllSessions();
  return sessions.find((s) => s.id === id) || null;
};

/**
 * Save session (create or update)
 */
export const saveSession = (session: XiDachSession): void => {
  try {
    const sessions = getAllSessions();
    const index = sessions.findIndex((s) => s.id === session.id);

    // Update timestamp
    session.updatedAt = getTimestamp();

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    const data: XiDachStorageData = {
      version: STORAGE_VERSION,
      sessions,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[XiDachStorage] Error saving session:', error);
    throw error;
  }
};

/**
 * Delete session by ID
 */
export const deleteSession = (id: string): void => {
  try {
    const sessions = getAllSessions().filter((s) => s.id !== id);

    const data: XiDachStorageData = {
      version: STORAGE_VERSION,
      sessions,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[XiDachStorage] Error deleting session:', error);
    throw error;
  }
};

// ============== SESSION FACTORY ==============

/**
 * Create new session with default values
 */
export const createSession = (
  name: string,
  settings: Partial<XiDachSettings> = {}
): XiDachSession => {
  const now = getTimestamp();

  return {
    id: generateId(),
    name: name.trim() || 'Bàn mới',
    players: [],
    matches: [],
    currentDealerId: null,
    settings: { ...DEFAULT_XI_DACH_SETTINGS, ...settings },
    status: 'setup',
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Create new player
 */
export const createPlayer = (name: string, baseScore: number = 0): XiDachPlayer => {
  return {
    id: generateId(),
    name: name.trim(),
    baseScore,
    currentScore: baseScore,
    isActive: true,
    createdAt: getTimestamp(),
  };
};

// ============== SCORE CALCULATION ==============

/**
 * Calculate score change for a player result
 * Formula:
 * - tuCount = total number of tụ (wins/losses)
 * - xiBanCount = number of tụ with xì bàn (×2 multiplier)
 * - nguLinhCount = number of tụ with ngũ linh (×2 multiplier)
 * - normalTu = tuCount - xiBanCount - nguLinhCount (regular tụ, ×1)
 * - score = (normalTu × 1 + xiBanCount × 2 + nguLinhCount × 2) × pointsPerTu
 *         = (tuCount + xiBanCount + nguLinhCount) × pointsPerTu
 */
export const calculateScoreChange = (
  result: Omit<XiDachPlayerResult, 'scoreChange'>,
  settings: XiDachSettings
): number => {
  // Normal tụ (×1) + xiBan tụ (×2) + nguLinh tụ (×2)
  // = (tuCount - xiBan - nguLinh) + (xiBan × 2) + (nguLinh × 2)
  // = tuCount + xiBan + nguLinh
  const totalMultipliedTu = result.tuCount + result.xiBanCount + result.nguLinhCount;
  let score = totalMultipliedTu * settings.pointsPerTu;

  // Apply outcome (negative if lose)
  if (result.outcome === 'lose') {
    score = -score;
  }

  // Apply penalty 28 (paid to others when busting)
  if (result.penalty28 && result.penalty28Recipients.length > 0) {
    // If penalty28Enabled: use fixed amount
    // If not: use the bet amount (same as score amount)
    const betAmount = totalMultipliedTu * settings.pointsPerTu;
    const penaltyPerRecipient = settings.penalty28Enabled
      ? settings.penalty28Amount
      : betAmount;
    score -= penaltyPerRecipient * result.penalty28Recipients.length;
  }

  return score;
};

/**
 * Create player result with calculated score
 */
export const createPlayerResult = (
  playerId: string,
  input: {
    tuCount: number;
    outcome: 'win' | 'lose';
    xiBanCount?: number;
    nguLinhCount?: number;
    penalty28?: boolean;
    penalty28Recipients?: string[];
  },
  settings: XiDachSettings
): XiDachPlayerResult => {
  const result: Omit<XiDachPlayerResult, 'scoreChange'> = {
    playerId,
    tuCount: input.tuCount,
    outcome: input.outcome,
    xiBanCount: input.xiBanCount || 0,
    nguLinhCount: input.nguLinhCount || 0,
    penalty28: input.penalty28 || false,
    penalty28Recipients: input.penalty28Recipients || [],
  };

  return {
    ...result,
    scoreChange: calculateScoreChange(result, settings),
  };
};

// ============== SETTLEMENT CALCULATION ==============

/**
 * Calculate settlement (who pays whom)
 * Uses greedy algorithm to minimize transactions
 */
export const calculateSettlement = (session: XiDachSession): XiDachSettlement[] => {
  const settlements: XiDachSettlement[] = [];
  const players = session.players.filter((p) => p.isActive);

  // Calculate net balance for each player (current - base)
  const balances = players.map((p) => ({
    id: p.id,
    balance: p.currentScore - p.baseScore,
  }));

  // Separate winners (positive) and losers (negative)
  const winners = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);

  const losers = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance);

  // Greedy matching
  let i = 0;
  let j = 0;

  while (i < losers.length && j < winners.length) {
    const loser = losers[i];
    const winner = winners[j];

    const amount = Math.min(loser.balance, winner.balance);

    if (amount > 0) {
      settlements.push({
        fromPlayerId: loser.id,
        toPlayerId: winner.id,
        amount,
      });
    }

    loser.balance -= amount;
    winner.balance -= amount;

    if (loser.balance === 0) i++;
    if (winner.balance === 0) j++;
  }

  return settlements;
};

// ============== PLAYER SCORE RECALCULATION ==============

/**
 * Recalculate all player current scores from matches
 */
export const recalculatePlayerScores = (session: XiDachSession): XiDachSession => {
  // Reset to base scores
  const updatedPlayers = session.players.map((p) => ({
    ...p,
    currentScore: p.baseScore,
  }));

  // Apply all match results
  for (const match of session.matches) {
    for (const result of match.results) {
      const player = updatedPlayers.find((p) => p.id === result.playerId);
      if (player) {
        player.currentScore += result.scoreChange;
      }

      // Handle penalty 28 recipients (they receive the penalty amount)
      if (result.penalty28 && result.penalty28Recipients.length > 0) {
        // Calculate penalty per recipient based on settings
        // Formula: (tuCount + xiBanCount + nguLinhCount) × pointsPerTu
        const betAmount = (result.tuCount + result.xiBanCount + result.nguLinhCount) * session.settings.pointsPerTu;
        const amountPerRecipient = session.settings.penalty28Enabled
          ? session.settings.penalty28Amount
          : betAmount;

        for (const recipientId of result.penalty28Recipients) {
          const recipient = updatedPlayers.find((p) => p.id === recipientId);
          if (recipient) {
            recipient.currentScore += amountPerRecipient;
          }
        }
      }
    }
  }

  return {
    ...session,
    players: updatedPlayers,
  };
};

// ============== AUTO-ROTATE DEALER ==============

/**
 * Check if dealer should auto-rotate
 */
export const shouldAutoRotateDealer = (session: XiDachSession): boolean => {
  if (!session.settings.autoRotateDealer) return false;
  if (session.matches.length === 0) return false;

  return session.matches.length % session.settings.autoRotateAfter === 0;
};

/**
 * Get next dealer ID (round-robin)
 */
export const getNextDealerId = (session: XiDachSession): string | null => {
  const activePlayers = session.players.filter((p) => p.isActive);
  if (activePlayers.length === 0) return null;

  if (!session.currentDealerId) {
    return activePlayers[0].id;
  }

  const currentIndex = activePlayers.findIndex((p) => p.id === session.currentDealerId);
  const nextIndex = (currentIndex + 1) % activePlayers.length;

  return activePlayers[nextIndex].id;
};
