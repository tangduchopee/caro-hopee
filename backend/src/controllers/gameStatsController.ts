import { Request, Response } from 'express';
import GameStats from '../models/GameStats';
import GameType from '../models/GameType';
import { AuthRequest } from '../middleware/authMiddleware';
import { createSessionAfterSubmission } from '../middleware/validateScore';

/**
 * Get stats for a specific user and game
 */
export const getUserGameStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId, userId } = req.params;

    // Verify game exists
    const gameType = await GameType.findOne({ gameId, isActive: true });
    if (!gameType) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    const stats = await GameStats.findOne({
      userId,
      gameId,
    }).populate('userId', 'username');

    if (!stats) {
      // Return default stats if not found
      res.json({
        userId,
        gameId,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
        customStats: {},
        streaks: { currentWin: 0, currentLoss: 0, bestWin: 0, bestLoss: 0 },
        byBoardSize: {},
        totalPlayTime: 0,
        avgGameDuration: 0,
        lastTenGames: [],
        lastPlayed: null,
      });
      return;
    }

    res.json({
      _id: stats._id,
      userId: stats.userId,
      gameId: stats.gameId,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      totalScore: stats.totalScore,
      customStats: Object.fromEntries(stats.customStats || new Map()),
      streaks: stats.streaks,
      byBoardSize: Object.fromEntries(stats.byBoardSize || new Map()),
      totalPlayTime: stats.totalPlayTime,
      avgGameDuration: stats.avgGameDuration,
      lastTenGames: stats.lastTenGames,
      lastPlayed: stats.lastPlayed,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get current user's stats for a game
 */
export const getMyGameStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Verify game exists
    const gameType = await GameType.findOne({ gameId, isActive: true });
    if (!gameType) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    let stats = await GameStats.findOne({
      userId,
      gameId,
    });

    if (!stats) {
      // Create default stats if not exists
      stats = new GameStats({
        userId,
        gameId,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
        streaks: { currentWin: 0, currentLoss: 0, bestWin: 0, bestLoss: 0 },
        byBoardSize: new Map(),
        totalPlayTime: 0,
        avgGameDuration: 0,
        lastTenGames: [],
      });
      await stats.save();
    }

    res.json({
      _id: stats._id,
      userId: stats.userId,
      gameId: stats.gameId,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      totalScore: stats.totalScore,
      customStats: Object.fromEntries(stats.customStats || new Map()),
      streaks: stats.streaks,
      byBoardSize: Object.fromEntries(stats.byBoardSize || new Map()),
      totalPlayTime: stats.totalPlayTime,
      avgGameDuration: stats.avgGameDuration,
      lastTenGames: stats.lastTenGames,
      lastPlayed: stats.lastPlayed,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Submit game result and update stats
 * This should be called after a game finishes
 */
export const submitGameResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const userId = req.user?.userId;
    const { result, score, customStats, boardSize, gameDuration } = req.body; // result: 'win' | 'loss' | 'draw'

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!['win', 'loss', 'draw'].includes(result)) {
      res.status(400).json({ message: 'Invalid result. Must be win, loss, or draw' });
      return;
    }

    // Verify game exists
    const gameType = await GameType.findOne({ gameId, isActive: true });
    if (!gameType) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    // Find or create stats
    let stats = await GameStats.findOne({
      userId,
      gameId,
    });

    if (!stats) {
      stats = new GameStats({
        userId,
        gameId,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
        streaks: {
          currentWin: 0,
          currentLoss: 0,
          bestWin: 0,
          bestLoss: 0,
        },
        byBoardSize: new Map(),
        totalPlayTime: 0,
        avgGameDuration: 0,
        lastTenGames: [],
      });
    }

    // Update stats based on result
    if (result === 'win') {
      stats.wins += 1;
    } else if (result === 'loss') {
      stats.losses += 1;
    } else if (result === 'draw') {
      stats.draws += 1;
    }

    // Update total score (can be customized per game)
    if (typeof score === 'number') {
      stats.totalScore += score;
    } else {
      // Default scoring: win = +10, loss = -5, draw = +2
      if (result === 'win') {
        stats.totalScore += 10;
      } else if (result === 'loss') {
        stats.totalScore = Math.max(0, stats.totalScore - 5);
      } else if (result === 'draw') {
        stats.totalScore += 2;
      }
    }

    // Update streaks
    if (result === 'win') {
      stats.streaks.currentWin += 1;
      stats.streaks.currentLoss = 0;
      stats.streaks.bestWin = Math.max(stats.streaks.bestWin, stats.streaks.currentWin);
    } else if (result === 'loss') {
      stats.streaks.currentLoss += 1;
      stats.streaks.currentWin = 0;
      stats.streaks.bestLoss = Math.max(stats.streaks.bestLoss, stats.streaks.currentLoss);
    } else {
      // Draw resets both current streaks
      stats.streaks.currentWin = 0;
      stats.streaks.currentLoss = 0;
    }

    // Update board size stats if provided
    if (boardSize) {
      const boardKey = String(boardSize);
      const currentBoardStats = stats.byBoardSize.get(boardKey) || { wins: 0, losses: 0, draws: 0 };
      if (result === 'win') {
        currentBoardStats.wins += 1;
      } else if (result === 'loss') {
        currentBoardStats.losses += 1;
      } else {
        currentBoardStats.draws += 1;
      }
      stats.byBoardSize.set(boardKey, currentBoardStats);
    }

    // Update play time stats if duration provided (in seconds)
    if (typeof gameDuration === 'number' && gameDuration > 0) {
      const totalGames = stats.wins + stats.losses + stats.draws;
      stats.totalPlayTime += gameDuration;
      stats.avgGameDuration = Math.round(stats.totalPlayTime / totalGames);
    }

    // Update lastTenGames
    const resultCode = result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D';
    stats.lastTenGames.push(resultCode as 'W' | 'L' | 'D');
    if (stats.lastTenGames.length > 10) {
      stats.lastTenGames = stats.lastTenGames.slice(-10);
    }

    // Update custom stats if provided
    if (customStats && typeof customStats === 'object') {
      for (const [key, value] of Object.entries(customStats)) {
        stats.customStats.set(key, value);
      }
    }

    stats.lastPlayed = new Date();
    await stats.save();

    // Create game session record for audit trail
    const { gameData, guestId } = req.body;
    await createSessionAfterSubmission(
      gameId,
      userId || null,
      guestId || null,
      result,
      stats.totalScore,
      gameData || {}
    );

    res.json({
      _id: stats._id,
      userId: stats.userId,
      gameId: stats.gameId,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      totalScore: stats.totalScore,
      customStats: Object.fromEntries(stats.customStats || new Map()),
      streaks: stats.streaks,
      byBoardSize: Object.fromEntries(stats.byBoardSize || new Map()),
      totalPlayTime: stats.totalPlayTime,
      avgGameDuration: stats.avgGameDuration,
      lastTenGames: stats.lastTenGames,
      lastPlayed: stats.lastPlayed,
      updatedAt: stats.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

