import { GameHistory } from '../types/game.types';
import { logger } from './logger';

const GUEST_HISTORY_KEY = 'caro_guest_history';
const MAX_GUEST_HISTORY = 20;

/**
 * Save game history to localStorage for guest users
 * Only keeps the last 20 games
 */
export const saveGuestHistory = (game: {
  roomId: string;
  roomCode: string;
  boardSize: number;
  board: number[][];
  winner: 1 | 2 | null | 'draw';
  winningLine?: Array<{ row: number; col: number }>;
  score: { player1: number; player2: number };
  finishedAt: string | null;
  createdAt: string;
  myPlayerNumber: 1 | 2;
  opponentUsername: string;
  result: 'win' | 'loss' | 'draw';
}): void => {
  try {
    // Get existing history
    const existingHistory = getGuestHistory();
    
    // Create history entry
    const historyEntry: GameHistory = {
      _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId: game.roomId,
      roomCode: game.roomCode,
      boardSize: game.boardSize,
      board: game.board,
      winner: game.winner,
      winningLine: game.winningLine,
      result: game.result,
      opponentUsername: game.opponentUsername,
      finishedAt: game.finishedAt,
      createdAt: game.createdAt,
      score: game.score,
    };
    
    // Add new entry at the beginning
    const updatedHistory = [historyEntry, ...existingHistory];
    
    // Keep only last 20 games
    const trimmedHistory = updatedHistory.slice(0, MAX_GUEST_HISTORY);
    
    // Save to localStorage
    localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(trimmedHistory));
    
    logger.log('[guestHistory] Saved game to guest history:', historyEntry.roomCode);
  } catch (error) {
    logger.error('[guestHistory] Failed to save guest history:', error);
    // Don't throw - localStorage might not be available
  }
};

/**
 * Get game history from localStorage for guest users
 */
export const getGuestHistory = (): GameHistory[] => {
  try {
    const historyJson = localStorage.getItem(GUEST_HISTORY_KEY);
    if (!historyJson) {
      return [];
    }
    
    const history = JSON.parse(historyJson) as GameHistory[];
    // Validate and filter out invalid entries
    return history.filter(h => h && h.roomId && h.board);
  } catch (error) {
    logger.error('[guestHistory] Failed to read guest history:', error);
    return [];
  }
};

/**
 * Clear guest history from localStorage
 */
export const clearGuestHistory = (): void => {
  try {
    localStorage.removeItem(GUEST_HISTORY_KEY);
    logger.log('[guestHistory] Cleared guest history');
  } catch (error) {
    logger.error('[guestHistory] Failed to clear guest history:', error);
  }
};
