import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Game from '../models/Game';
import GameHistory from '../models/GameHistory';
import { initializeBoard, generateRoomCode } from '../services/gameEngine';
import { AuthRequest } from '../middleware/authMiddleware';
import { io } from '../server';
import User from '../models/User';

export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[createGame] Request received:', { 
      body: req.body, 
      hasAuth: !!req.headers.authorization,
      boardSize: req.body?.boardSize,
      guestId: req.body?.guestId 
    });
    
    const { boardSize = 15, rules = {}, guestId } = req.body;
    const authReq = req as AuthRequest;
    
    // Try to get user from token (optional auth - allow both authenticated and guest)
    let userId: string | null = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const { verifyToken } = await import('../utils/jwt');
        const decoded = verifyToken(token);
        userId = decoded.userId;
        console.log('[createGame] Authenticated user:', userId);
      }
    } catch (error) {
      // Token invalid or not provided - continue as guest
      console.log('[createGame] No valid token provided, creating game as guest');
    }
    
    // Use userId from token or from authReq.user (fallback)
    const finalUserId = userId || authReq.user?.userId || null;

    console.log('[createGame] Creating game with:', { 
      boardSize, 
      finalUserId, 
      guestId, 
      rules 
    });

    const roomId = uuidv4();
    const roomCode = await generateRoomCode();
    const board = initializeBoard(boardSize);

    console.log('[createGame] Generated roomId:', roomId, 'roomCode:', roomCode);

    const game = new Game({
      roomId,
      roomCode,
      gameType: 'caro', // Set game type
      player1: finalUserId ? (finalUserId as any) : null,
      player1GuestId: finalUserId ? null : guestId || null,
      boardSize,
      board,
      rules: {
        blockTwoEnds: rules.blockTwoEnds || false,
        allowUndo: rules.allowUndo !== undefined ? rules.allowUndo : true,
        maxUndoPerGame: rules.maxUndoPerGame || 3,
        timeLimit: rules.timeLimit || null,
      },
      gameStatus: 'waiting',
    });

    console.log('[createGame] Saving game to database...');
    await game.save();
    console.log('[createGame] Game saved successfully:', game.roomId);

    // Emit socket event to notify all users in lobby about new game
    // Get player1 username for the event
    let player1Username: string | null = null;
    if (finalUserId) {
      const user1 = await User.findById(finalUserId).select('username').lean();
      player1Username = user1?.username || 'Player 1';
    } else if (guestId) {
      player1Username = `Guest ${guestId.slice(-6)}`;
    }

    io.emit('game-created', {
      roomId: game.roomId,
      roomCode: game.roomCode,
      boardSize: game.boardSize,
      gameStatus: game.gameStatus,
      player1Username,
      createdAt: game.createdAt.toISOString(),
    });

    res.status(201).json({
      _id: game._id.toString(),
      roomId: game.roomId,
      roomCode: game.roomCode,
      player1: game.player1?.toString() || null,
      player2: game.player2?.toString() || null,
      player1GuestId: game.player1GuestId,
      player2GuestId: game.player2GuestId,
      boardSize: game.boardSize,
      board: game.board,
      currentPlayer: game.currentPlayer,
      gameStatus: game.gameStatus,
      winner: game.winner,
      rules: game.rules,
      score: game.score,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      finishedAt: game.finishedAt?.toISOString() || null,
    });
    
    console.log('[createGame] Response sent successfully');
  } catch (error: any) {
    console.error('[createGame] Error creating game:', error);
    console.error('[createGame] Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to create game',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const game = await Game.findOne({ roomId })
      .populate('player1', 'username')
      .populate('player2', 'username');

    if (!game) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    res.json({
      _id: game._id.toString(),
      roomId: game.roomId,
      roomCode: game.roomCode,
      player1: game.player1?.toString() || null,
      player2: game.player2?.toString() || null,
      player1GuestId: game.player1GuestId,
      player2GuestId: game.player2GuestId,
      boardSize: game.boardSize,
      board: game.board,
      currentPlayer: game.currentPlayer,
      gameStatus: game.gameStatus,
      winner: game.winner,
      rules: game.rules,
      score: game.score,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      finishedAt: game.finishedAt?.toISOString() || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGameByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomCode } = req.params;
    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('player1', 'username')
      .populate('player2', 'username');

    if (!game) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    res.json({
      _id: game._id.toString(),
      roomId: game.roomId,
      roomCode: game.roomCode,
      player1: game.player1?.toString() || null,
      player2: game.player2?.toString() || null,
      player1GuestId: game.player1GuestId,
      player2GuestId: game.player2GuestId,
      boardSize: game.boardSize,
      board: game.board,
      currentPlayer: game.currentPlayer,
      gameStatus: game.gameStatus,
      winner: game.winner,
      rules: game.rules,
      score: game.score,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      finishedAt: game.finishedAt?.toISOString() || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { guestId } = req.body;
    const authReq = req as AuthRequest;
    
    // Try to get user from token (optional auth - allow both authenticated and guest)
    let userId: string | null = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const { verifyToken } = await import('../utils/jwt');
        const decoded = verifyToken(token);
        userId = decoded.userId;
      }
    } catch (error) {
      // Token invalid or not provided - continue as guest
      console.log('No valid token provided, joining game as guest');
    }
    
    // Use userId from token or from authReq.user (fallback)
    const finalUserId = userId || authReq.user?.userId || null;

    const game = await Game.findOne({ roomId });

    if (!game) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    // Check if game is playing - cannot join
    if (game.gameStatus === 'playing') {
      res.status(400).json({ message: 'Game is already in progress and cannot be joined' });
      return;
    }

    if (game.gameStatus !== 'waiting') {
      res.status(400).json({ message: 'Game is not available for joining' });
      return;
    }

    // Check if user is already in the game
    const userIdToCheck = finalUserId;
    const isPlayer1 = userIdToCheck 
      ? game.player1 && game.player1.toString() === userIdToCheck.toString()
      : game.player1GuestId === guestId;
    const isPlayer2 = userIdToCheck
      ? game.player2 && game.player2.toString() === userIdToCheck.toString()
      : game.player2GuestId === guestId;

    if (isPlayer1 || isPlayer2) {
      res.json({
        _id: game._id.toString(),
        roomId: game.roomId,
        roomCode: game.roomCode,
        player1: game.player1?.toString() || null,
        player2: game.player2?.toString() || null,
        player1GuestId: game.player1GuestId,
        player2GuestId: game.player2GuestId,
        boardSize: game.boardSize,
        board: game.board,
        currentPlayer: game.currentPlayer,
        gameStatus: game.gameStatus,
        winner: game.winner,
        rules: game.rules,
        score: game.score,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
        finishedAt: game.finishedAt?.toISOString() || null,
      });
      return;
    }
    
    // Check if game is full (has both players) - cannot join
    const hasPlayer1 = !!(game.player1 || game.player1GuestId);
    const hasPlayer2 = !!(game.player2 || game.player2GuestId);
    
    if (hasPlayer1 && hasPlayer2) {
      res.status(400).json({ message: 'Game is full (2/2 players). Please wait for the game to start or find another game.' });
      return;
    }

    // Join as player2
    if (!game.player2 && !game.player2GuestId) {
      if (userIdToCheck) {
        game.player2 = userIdToCheck as any;
        game.player2GuestId = null; // Clear guestId if joining as authenticated user
      } else {
        game.player2GuestId = guestId || null;
      }
    }

    await game.save();

    // Emit socket event to room
    const user2 = userIdToCheck ? await User.findById(userIdToCheck).select('username').lean() : null;
    io.to(roomId).emit('player-joined', {
      player: {
        id: userIdToCheck || guestId || '',
        username: userIdToCheck ? (user2?.username || 'Player 2') : `Guest ${guestId?.slice(-6) || ''}`,
        isGuest: !userIdToCheck,
        playerNumber: 2,
      },
    });

    // Emit socket event to lobby about game status update
    // Recalculate after save (game state may have changed)
    const hasPlayer1After = !!(game.player1 || game.player1GuestId);
    const hasPlayer2After = !!(game.player2 || game.player2GuestId);
    const playerCount = (hasPlayer1After ? 1 : 0) + (hasPlayer2After ? 1 : 0);
    const isFull = hasPlayer1After && hasPlayer2After;
    
    // After join, gameStatus is still 'waiting' (game hasn't started yet)
    // But check it anyway for type safety
    const currentGameStatus = game.gameStatus as string;
    let displayStatus: 'waiting' | 'ready' | 'playing';
    if (currentGameStatus === 'playing') {
      displayStatus = 'playing';
    } else if (isFull) {
      displayStatus = 'ready';
    } else {
      displayStatus = 'waiting';
    }

    io.emit('game-status-updated', {
      roomId: game.roomId,
      roomCode: game.roomCode,
      gameStatus: game.gameStatus,
      displayStatus,
      playerCount,
      isFull,
    });
    
    res.json({
      _id: game._id.toString(),
      roomId: game.roomId,
      roomCode: game.roomCode,
      player1: game.player1?.toString() || null,
      player2: game.player2?.toString() || null,
      player1GuestId: game.player1GuestId,
      player2GuestId: game.player2GuestId,
      boardSize: game.boardSize,
      board: game.board,
      currentPlayer: game.currentPlayer,
      gameStatus: game.gameStatus,
      winner: game.winner,
      rules: game.rules,
      score: game.score,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      finishedAt: game.finishedAt?.toISOString() || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const games = await Game.find({
      $or: [
        { player1: userId },
        { player2: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('roomId roomCode boardSize gameStatus createdAt');

    res.json(games);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getWaitingGames = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all active games (waiting with 1 player, waiting with 2 players, and playing)
    // Exclude finished and abandoned games
    const games = await Game.find({
      gameStatus: { $in: ['waiting', 'playing'] },
      $or: [
        { player1: { $ne: null } },
        { player1GuestId: { $ne: null } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('roomId roomCode boardSize gameStatus player1 player2 player1GuestId player2GuestId createdAt')
      .populate('player1', 'username')
      .populate('player2', 'username');

    // Format response with display status
    const formattedGames = games.map(game => {
      const hasPlayer1 = !!(game.player1 || game.player1GuestId);
      const hasPlayer2 = !!(game.player2 || game.player2GuestId);
      const playerCount = (hasPlayer1 ? 1 : 0) + (hasPlayer2 ? 1 : 0);
      const isFull = hasPlayer1 && hasPlayer2;
      
      // Determine display status
      let displayStatus: 'waiting' | 'ready' | 'playing';
      let statusLabel: string;
      let canJoin: boolean;
      
      if (game.gameStatus === 'playing') {
        displayStatus = 'playing';
        statusLabel = 'Playing';
        canJoin = false;
      } else if (isFull) {
        displayStatus = 'ready';
        statusLabel = 'Ready (2/2)';
        canJoin = false;
      } else {
        displayStatus = 'waiting';
        statusLabel = `Waiting (${playerCount}/2)`;
        canJoin = true;
      }

      // Get player1 username
      let player1Username: string | null = null;
      if (game.player1 && typeof game.player1 === 'object' && 'username' in game.player1) {
        player1Username = (game.player1 as any).username || 'Player 1';
      } else if (game.player1GuestId) {
        player1Username = `Guest ${game.player1GuestId.slice(-6)}`;
      }

      return {
        _id: game._id.toString(),
        roomId: game.roomId,
        roomCode: game.roomCode,
        boardSize: game.boardSize,
        gameStatus: game.gameStatus,
        displayStatus, // 'waiting' | 'ready' | 'playing'
        statusLabel, // Display text
        canJoin, // Whether others can join
        hasPlayer1,
        hasPlayer2,
        playerCount,
        player1Username,
        createdAt: game.createdAt.toISOString(),
      };
    });

    res.json(formattedGames);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const leaveGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { guestId } = req.body;
    const authReq = req as AuthRequest;
    
    const game = await Game.findOne({ roomId });

    if (!game) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    // Determine which player is leaving
    let isPlayer1 = false;
    let isPlayer2 = false;
    
    // Check if authenticated user is player1 or player2
    if (authReq.user?.userId) {
      isPlayer1 = !!(game.player1 && game.player1.toString() === authReq.user.userId.toString());
      isPlayer2 = !!(game.player2 && game.player2.toString() === authReq.user.userId.toString());
    }
    
    // Also check if guestId matches player1GuestId or player2GuestId
    if (guestId) {
      if (game.player1GuestId && game.player1GuestId === guestId) {
        isPlayer1 = true;
      }
      if (game.player2GuestId && game.player2GuestId === guestId) {
        isPlayer2 = true;
      }
    }

    // If player is not in the game, return success (they're already not in it)
    if (!isPlayer1 && !isPlayer2) {
      res.json({ message: 'Player not in game', gameDeleted: false });
      return;
    }

    // Check if game was finished before player left
    const wasFinished = game.gameStatus === 'finished';

    // Check players BEFORE removing (to determine if we need host transfer)
    const hasPlayer1Before = !!(game.player1 || game.player1GuestId);
    const hasPlayer2Before = !!(game.player2 || game.player2GuestId);

    // Remove the player from the game
    if (isPlayer1) {
      game.player1 = null;
      game.player1GuestId = null;
    } else if (isPlayer2) {
      game.player2 = null;
      game.player2GuestId = null;
    }

    // Check players AFTER removing (to determine final state)
    const hasPlayer1After = !!(game.player1 || game.player1GuestId);
    const hasPlayer2After = !!(game.player2 || game.player2GuestId);
    const hasNoPlayers = !hasPlayer1After && !hasPlayer2After;

    if (hasNoPlayers) {
      // Case 1: Game finished + cả 2 player rời → lưu vào history và xóa game
      if (game.gameStatus === 'finished' && game.finishedAt) {
        // Save to history before deleting
        const historyRecord = new GameHistory({
          originalGameId: game._id.toString(),
          roomId: game.roomId,
          roomCode: game.roomCode,
          gameType: game.gameType,
          player1: game.player1,
          player2: game.player2,
          player1GuestId: game.player1GuestId,
          player2GuestId: game.player2GuestId,
          boardSize: game.boardSize,
          board: game.board,
          winner: game.winner,
          score: game.score,
          rules: game.rules,
          finishedAt: game.finishedAt,
          createdAt: game.createdAt,
          savedAt: new Date(),
        });
        await historyRecord.save();
        
        // Clean up old history (keep only last 20 for each player)
        await cleanupOldHistory(game.player1, game.player1GuestId, game.player2, game.player2GuestId);
        
        // Delete the game to save space
        await Game.deleteOne({ roomId });
        
        console.log(`[leaveGame] Game ${roomId} finished, saved to history and deleted`);
        
        // Emit socket event to notify other clients (if any)
        io.to(roomId).emit('game-deleted', { roomId });
        
        res.json({ 
          message: 'Game finished - saved to history and deleted', 
          gameDeleted: true 
        });
        return;
      } else {
        // Case 3: Game chưa finished + cả 2 player rời → xóa game
      await Game.deleteOne({ roomId });
      
      // Emit socket event to notify all clients in lobby (not just in room)
      io.emit('game-deleted', { roomId });
      
      res.json({ 
        message: 'Game deleted - no players remaining', 
        gameDeleted: true 
      });
        return;
      }
    } else {
      let gameReset = false;
      let hostTransferred = false;
      
      // If player1 (host) left and player2 still exists AFTER removal, transfer host to player2
      if (isPlayer1 && hasPlayer2After) {
        // Transfer player2 to player1 (host transfer)
        game.player1 = game.player2;
        game.player1GuestId = game.player2GuestId;
        game.player2 = null;
        game.player2GuestId = null;
        hostTransferred = true;
        console.log(`[leaveGame] Host transferred: Player2 (${game.player1 || game.player1GuestId}) is now Player1`);
        
        // Case 2: Game finished + 1 player rời → reset về waiting
        if (wasFinished) {
          game.gameStatus = 'waiting';
          game.winner = null;
          game.finishedAt = null;
          // Reset board for new game
          game.board = Array(game.boardSize)
            .fill(null)
            .map(() => Array(game.boardSize).fill(0));
          game.currentPlayer = 1;
          gameReset = true;
        } else if (game.gameStatus === 'playing') {
          // Case 4: Game playing + 1 player rời → reset về waiting
          game.gameStatus = 'waiting';
          game.winner = null;
          game.finishedAt = null;
          // Reset board for new game
          game.board = Array(game.boardSize)
            .fill(null)
            .map(() => Array(game.boardSize).fill(0));
          game.currentPlayer = 1;
          gameReset = true;
        } else if (game.gameStatus === 'waiting') {
          // Keep as waiting so it shows in lobby
          game.gameStatus = 'waiting';
        }
      } else if (isPlayer2 && hasPlayer1After) {
        // Player2 left, player1 still there - just remove player2 (no host transfer needed)
        // Case 2: Game finished + 1 player rời → reset về waiting
        if (wasFinished) {
          game.gameStatus = 'waiting';
          game.winner = null;
          game.finishedAt = null;
          // Reset board for new game
          game.board = Array(game.boardSize)
            .fill(null)
            .map(() => Array(game.boardSize).fill(0));
          game.currentPlayer = 1;
          gameReset = true;
        } else if (game.gameStatus === 'playing') {
          // Case 4: Game playing + 1 player rời → reset về waiting
          game.gameStatus = 'waiting';
          game.winner = null;
          game.finishedAt = null;
          // Reset board for new game
          game.board = Array(game.boardSize)
            .fill(null)
            .map(() => Array(game.boardSize).fill(0));
          game.currentPlayer = 1;
          gameReset = true;
        } else if (game.gameStatus === 'waiting') {
          // Explicitly set to waiting to ensure it shows in lobby
          game.gameStatus = 'waiting';
        }
      }
      
      await game.save();
      
      console.log(`[leaveGame] Player left - isPlayer1: ${isPlayer1}, isPlayer2: ${isPlayer2}, hostTransferred: ${hostTransferred}, hasPlayer1After: ${hasPlayer1After}, hasPlayer2After: ${hasPlayer2After}`);
      console.log(`[leaveGame] Game state after leave - player1: ${game.player1 || game.player1GuestId || 'null'}, player2: ${game.player2 || game.player2GuestId || 'null'}, gameStatus: ${game.gameStatus}`);
      
      // Emit socket event to notify other players in room
      io.to(roomId).emit('player-left', { 
        playerNumber: isPlayer1 ? 1 : 2,
        roomId,
        hostTransferred: hostTransferred, // Notify if host was transferred
        gameReset: gameReset, // Notify if game was reset from finished to waiting
      });

      // Emit socket event to lobby about game status update
      const playerCount = (hasPlayer1After ? 1 : 0) + (hasPlayer2After ? 1 : 0);
      const isFull = hasPlayer1After && hasPlayer2After;
      
      let displayStatus: 'waiting' | 'ready' | 'playing';
      if (game.gameStatus === 'playing') {
        displayStatus = 'playing';
      } else if (isFull) {
        displayStatus = 'ready';
      } else {
        displayStatus = 'waiting';
      }

      io.emit('game-status-updated', {
        roomId: game.roomId,
        roomCode: game.roomCode,
        gameStatus: game.gameStatus,
        displayStatus,
        playerCount,
        isFull,
      });
      
      res.json({ 
        message: 'Player left game', 
        gameDeleted: false,
        hostTransferred: hostTransferred,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get game history for current user (last 20 finished games)
 */
/**
 * Clean up old history records - keep only last 20 for each player
 */
const cleanupOldHistory = async (
  player1: mongoose.Types.ObjectId | null,
  player1GuestId: string | null,
  player2: mongoose.Types.ObjectId | null,
  player2GuestId: string | null
): Promise<void> => {
  try {
    // Clean up for player1
    if (player1) {
      const player1History = await GameHistory.find({ player1 })
        .sort({ finishedAt: -1 })
        .select('_id')
        .lean();
      if (player1History.length > 20) {
        const idsToDelete = player1History.slice(20).map(h => h._id);
        await GameHistory.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`[cleanupOldHistory] Deleted ${idsToDelete.length} old history records for player1`);
      }
    } else if (player1GuestId) {
      const player1History = await GameHistory.find({ player1GuestId })
        .sort({ finishedAt: -1 })
        .select('_id')
        .lean();
      if (player1History.length > 20) {
        const idsToDelete = player1History.slice(20).map(h => h._id);
        await GameHistory.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`[cleanupOldHistory] Deleted ${idsToDelete.length} old history records for player1GuestId`);
      }
    }
    
    // Clean up for player2
    if (player2) {
      const player2History = await GameHistory.find({ player2 })
        .sort({ finishedAt: -1 })
        .select('_id')
        .lean();
      if (player2History.length > 20) {
        const idsToDelete = player2History.slice(20).map(h => h._id);
        await GameHistory.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`[cleanupOldHistory] Deleted ${idsToDelete.length} old history records for player2`);
      }
    } else if (player2GuestId) {
      const player2History = await GameHistory.find({ player2GuestId })
        .sort({ finishedAt: -1 })
        .select('_id')
        .lean();
      if (player2History.length > 20) {
        const idsToDelete = player2History.slice(20).map(h => h._id);
        await GameHistory.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`[cleanupOldHistory] Deleted ${idsToDelete.length} old history records for player2GuestId`);
      }
    }
  } catch (error: any) {
    console.error('[cleanupOldHistory] Error cleaning up old history:', error);
    // Don't throw - this is cleanup, shouldn't block the main operation
  }
};

export const getGameHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { guestId } = req.body;
    
    console.log(`[getGameHistory] Request received - userId: ${userId}, guestId: ${guestId}`);
    
    if (!userId && !guestId) {
      res.status(401).json({ message: 'Unauthorized - Please provide userId or guestId' });
      return;
    }

    // Build query to find finished games in history where user participated
    const query: any = {};

    // Add user filter - check both authenticated user and guest
    if (userId) {
      query.$or = [
        { player1: userId },
        { player2: userId },
      ];
    }
    if (guestId) {
      if (query.$or) {
        query.$or.push(
          { player1GuestId: guestId },
          { player2GuestId: guestId }
        );
      } else {
        query.$or = [
          { player1GuestId: guestId },
          { player2GuestId: guestId },
        ];
      }
    }

    // Get last 20 finished games from history
    console.log(`[getGameHistory] Query:`, JSON.stringify(query, null, 2));
    const games = await GameHistory.find(query)
      .sort({ finishedAt: -1 })
      .limit(20)
      .select('roomId roomCode boardSize board winner finishedAt createdAt player1 player2 player1GuestId player2GuestId score')
      .populate('player1', 'username')
      .populate('player2', 'username')
      .lean();
    
    console.log(`[getGameHistory] Found ${games.length} finished games in history`);

    // Format response with result for current user
    const history = games.map(game => {
      // Determine if current user is player1 or player2
      const isPlayer1 = userId 
        ? game.player1 && (game.player1 as any)._id?.toString() === userId.toString()
        : game.player1GuestId === guestId;
      const isPlayer2 = userId
        ? game.player2 && (game.player2 as any)._id?.toString() === userId.toString()
        : game.player2GuestId === guestId;

      // Determine result
      let result: 'win' | 'loss' | 'draw' = 'draw';
      if (game.winner === 'draw' || game.winner === null) {
        result = 'draw';
      } else if (isPlayer1 && game.winner === 1) {
        result = 'win';
      } else if (isPlayer2 && game.winner === 2) {
        result = 'win';
      } else {
        result = 'loss';
      }

      // Get opponent info
      let opponentUsername = 'Unknown';
      if (isPlayer1 && game.player2) {
        opponentUsername = (game.player2 as any).username || `Guest ${game.player2GuestId?.slice(-6) || ''}`;
      } else if (isPlayer2 && game.player1) {
        opponentUsername = (game.player1 as any).username || `Guest ${game.player1GuestId?.slice(-6) || ''}`;
      } else if (isPlayer1 && game.player2GuestId) {
        opponentUsername = `Guest ${game.player2GuestId.slice(-6)}`;
      } else if (isPlayer2 && game.player1GuestId) {
        opponentUsername = `Guest ${game.player1GuestId.slice(-6)}`;
      }

      return {
        _id: game._id.toString(),
        roomId: game.roomId,
        roomCode: game.roomCode,
        boardSize: game.boardSize,
        board: game.board,
        winner: game.winner,
        result, // 'win' | 'loss' | 'draw'
        opponentUsername,
        finishedAt: game.finishedAt?.toISOString() || null,
        createdAt: game.createdAt.toISOString(),
        score: game.score,
      };
    });

    res.json({ history, total: history.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
