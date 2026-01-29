/**
 * Xì Dách Score Tracker - TypeScript Types
 * Used for tracking scores in Vietnamese Blackjack card games
 */

// ============== PLAYER ==============

export interface XiDachPlayer {
  id: string;
  name: string;
  baseScore: number;      // Starting score (can be edited)
  currentScore: number;   // Calculated from baseScore + all match results
  isActive: boolean;      // False if player left mid-game
  createdAt: string;      // ISO string
}

// ============== MATCH RESULT ==============

export interface XiDachPlayerResult {
  playerId: string;
  tuCount: number;                    // Number of "tụ" (hands) played
  outcome: 'win' | 'lose';
  xiBanCount: number;                 // Number of xì bàn (x2 each)
  nguLinhCount: number;               // Number of ngũ linh (x2 each)
  penalty28: boolean;                 // Has to pay penalty for >28 points
  penalty28Recipients: string[];      // Player IDs who receive penalty
  scoreChange: number;                // Final calculated score change
}

// ============== MATCH ==============

export interface XiDachMatch {
  id: string;
  matchNumber: number;
  dealerId: string;                   // Dealer for this match
  results: XiDachPlayerResult[];
  timestamp: string;                  // ISO string
  editedAt?: string;                  // ISO string if edited
}

// ============== SETTINGS ==============

export interface XiDachSettings {
  pointsPerTu: number;                // Points per tụ (e.g., 10)
  penalty28Enabled: boolean;          // Enable fixed penalty 28 amount
  penalty28Amount: number;            // Penalty amount for >28 (e.g., 50) - only used if penalty28Enabled
  autoRotateDealer: boolean;          // Auto-rotate dealer after N matches
  autoRotateAfter: number;            // Number of matches before rotation
}

export const DEFAULT_XI_DACH_SETTINGS: XiDachSettings = {
  pointsPerTu: 10,
  penalty28Enabled: false,            // Default: penalty uses player's bet amount
  penalty28Amount: 50,
  autoRotateDealer: false,
  autoRotateAfter: 1,
};

// ============== SESSION ==============

export type XiDachSessionStatus = 'setup' | 'playing' | 'paused' | 'ended';

export interface XiDachSession {
  id: string;
  name: string;
  players: XiDachPlayer[];
  matches: XiDachMatch[];
  currentDealerId: string | null;
  settings: XiDachSettings;
  status: XiDachSessionStatus;
  createdAt: string;                  // ISO string
  updatedAt: string;                  // ISO string
}

// ============== SETTLEMENT ==============

export interface XiDachSettlement {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
}

// ============== STORAGE ==============

export interface XiDachStorageData {
  version: number;
  sessions: XiDachSession[];
}
