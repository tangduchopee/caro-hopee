import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import mongoose from 'mongoose';
import Game from '../models/Game';
import GameMove from '../models/GameMove';
import User from '../models/User';
import { makeMove, undoMove } from './gameEngine';
import { checkWin } from './winChecker';
import { PlayerNumber } from '../types/game.types';

interface SocketData {
  userId?: string;
  username?: string;
  isGuest?: boolean;
  playerId?: string;
  currentRoomId?: string;
}

export const setupSocketHandlers = (io: SocketIOServer): void => {
  io.on('connection', (socket) => {
    const socketData: SocketData = socket.data;

    // Join room
    socket.on('join-room', async (data: { roomId: string; playerId: string; isGuest: boolean }) => {
      try {
        const { roomId, playerId, isGuest } = data;
        socketData.currentRoomId = roomId;
        socketData.playerId = playerId;
        socketData.isGuest = isGuest;
        socket.join(roomId);

        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        // Socket should NOT assign player2 - only API joinGame should do that
        // Socket only handles joining the socket room for real-time communication
        // Player assignment is handled by the REST API joinGame endpoint

        // Emit current game state - only include players that actually exist and are set
        const players: any[] = [];
        
        // Add player1 if exists - populate username from User model
        if (game.player1) {
          const user1 = await User.findById(game.player1).select('username').lean();
          players.push({
            id: game.player1.toString(),
            username: user1?.username || 'Player 1',
            isGuest: false,
            playerNumber: 1,
          });
        } else if (game.player1GuestId) {
          players.push({
            id: game.player1GuestId,
            username: `Guest ${game.player1GuestId.slice(-6)}`,
            isGuest: true,
            playerNumber: 1,
          });
        }
        
        // Only add player2 if they actually exist (not null/undefined) - populate username from User model
        if (game.player2) {
          const user2 = await User.findById(game.player2).select('username').lean();
          players.push({
            id: game.player2.toString(),
            username: user2?.username || 'Player 2',
            isGuest: false,
            playerNumber: 2,
          });
        } else if (game.player2GuestId) {
          players.push({
            id: game.player2GuestId,
            username: `Guest ${game.player2GuestId.slice(-6)}`,
            isGuest: true,
            playerNumber: 2,
          });
        }

        // Emit room-joined with current game state
        socket.emit('room-joined', { 
          roomId, 
          players,
          gameStatus: game.gameStatus,
          currentPlayer: game.currentPlayer,
        });
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // Make move
    socket.on('make-move', async (data: { roomId: string; row: number; col: number }) => {
      try {
        const { roomId, row, col } = data;
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        console.log('Make move received:', { roomId, row, col, socketData });
        console.log('Game state:', {
          player1: game.player1?.toString(),
          player1GuestId: game.player1GuestId,
          player2: game.player2?.toString(),
          player2GuestId: game.player2GuestId,
          currentPlayer: game.currentPlayer,
          gameStatus: game.gameStatus,
        });

        // Determine player number - check both authenticated and guest
        let player: PlayerNumber = 1;
        let playerDetermined = false;
        
        console.log('Determining player - socketData:', {
          userId: socketData.userId,
          playerId: socketData.playerId,
          isGuest: socketData.isGuest,
        });
        
        // First check authenticated user
        if (socketData.userId) {
          if (game.player1?.toString() === socketData.userId) {
            player = 1;
            playerDetermined = true;
            console.log('Matched by authenticated userId as player1');
          } else if (game.player2?.toString() === socketData.userId) {
            player = 2;
            playerDetermined = true;
            console.log('Matched by authenticated userId as player2');
          }
        }
        
        // Check guest ID - this is the most common case for guest players
        // Check playerId first (most reliable)
        if (!playerDetermined && socketData.playerId) {
          if (game.player1GuestId && game.player1GuestId === socketData.playerId) {
            player = 1;
            playerDetermined = true;
            console.log('Matched by playerId as player1 (guest):', socketData.playerId);
          } else if (game.player2GuestId && game.player2GuestId === socketData.playerId) {
            player = 2;
            playerDetermined = true;
            console.log('Matched by playerId as player2 (guest):', socketData.playerId);
          } else {
            console.log('playerId did not match:', {
              socketPlayerId: socketData.playerId,
              gamePlayer1GuestId: game.player1GuestId,
              gamePlayer2GuestId: game.player2GuestId,
            });
          }
        }
        
        // Also check if authenticated user matches guest IDs (edge case)
        if (!playerDetermined && socketData.userId) {
          if (game.player1GuestId && game.player1GuestId === socketData.userId.toString()) {
            player = 1;
            playerDetermined = true;
            console.log('Matched by userId as guest player1');
          } else if (game.player2GuestId && game.player2GuestId === socketData.userId.toString()) {
            player = 2;
            playerDetermined = true;
            console.log('Matched by userId as guest player2');
          }
        }
        
        if (!playerDetermined) {
          console.error('Could not determine player - socketData:', JSON.stringify(socketData, null, 2), 'game:', {
            player1: game.player1?.toString(),
            player1GuestId: game.player1GuestId,
            player2: game.player2?.toString(),
            player2GuestId: game.player2GuestId,
          });
          socket.emit('game-error', { message: 'Could not determine player number. Please rejoin the room.' });
          return;
        }
        
        console.log('Player determined successfully:', player);

        console.log('Attempting move:', { row, col, player, currentPlayer: game.currentPlayer, gameStatus: game.gameStatus });

        const result = await makeMove(game, row, col, player);
        if (!result.success) {
          console.log('Move failed:', result.message);
          socket.emit('move-validated', { valid: false, message: result.message });
          return;
        }

        console.log('Move successful, reloading game to get latest state');

        // Reload game to get the latest state after makeMove
        const updatedGame = await Game.findOne({ roomId });
        if (!updatedGame) {
          socket.emit('game-error', { message: 'Game not found after move' });
          return;
        }

        // Get the move that was just made
        const move = await GameMove.findOne({
          gameId: updatedGame._id,
          row,
          col,
          player,
        }).sort({ timestamp: -1 });

        console.log('Emitting move-made to room:', {
          move: move ? { row: move.row, col: move.col, player: move.player } : null,
          currentPlayer: updatedGame.currentPlayer,
          gameStatus: updatedGame.gameStatus,
        });

        // Emit to all in room
        io.to(roomId).emit('move-made', {
          move: move ? {
            _id: move._id.toString(),
            gameId: move.gameId.toString(),
            player: move.player,
            row: move.row,
            col: move.col,
            moveNumber: move.moveNumber,
            timestamp: move.timestamp.toISOString(),
            isUndone: move.isUndone,
          } : null,
          board: updatedGame.board,
          currentPlayer: updatedGame.currentPlayer,
        });

        if (updatedGame.gameStatus === 'finished') {
          console.log('Game finished, emitting game-finished event');
          io.to(roomId).emit('game-finished', {
            winner: updatedGame.winner,
            reason: updatedGame.winner === 'draw' ? 'Draw' : `Player ${updatedGame.winner} wins!`,
          });
          io.to(roomId).emit('score-updated', { score: updatedGame.score });
        }
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // Request undo
    socket.on('request-undo', async (data: { roomId: string; moveNumber: number }) => {
      try {
        const { roomId, moveNumber } = data;
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        const move = await GameMove.findOne({
          gameId: game._id,
          moveNumber,
        });

        if (!move) {
          socket.emit('game-error', { message: 'Move not found' });
          return;
        }

        // Emit to opponent
        socket.to(roomId).emit('undo-requested', {
          moveNumber,
          requestedBy: move.player,
        });
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // Approve undo
    socket.on('approve-undo', async (data: { roomId: string; moveNumber: number }) => {
      try {
        const { roomId, moveNumber } = data;
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        const result = await undoMove(game, moveNumber);
        if (!result.success) {
          socket.emit('game-error', { message: result.message });
          return;
        }

        io.to(roomId).emit('undo-approved', {
          moveNumber,
          board: game.board,
        });
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // Reject undo
    socket.on('reject-undo', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('undo-rejected', { moveNumber: 0 });
    });

    // Start game
    socket.on('start-game', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        // Only allow starting if game is waiting and has 2 players
        if (game.gameStatus !== 'waiting') {
          socket.emit('game-error', { message: 'Game is not in waiting status' });
          return;
        }

        if (!game.player2 && !game.player2GuestId) {
          socket.emit('game-error', { message: 'Not enough players to start' });
          return;
        }

        // Determine which player is starting the game (whoever clicks start goes first)
        let startingPlayer: PlayerNumber = 1;
        let playerDetermined = false;

        // Check authenticated user ID first
        if (!playerDetermined && socketData.userId) {
          if (game.player1 && game.player1.toString() === socketData.userId.toString()) {
            startingPlayer = 1;
            playerDetermined = true;
          } else if (game.player2 && game.player2.toString() === socketData.userId.toString()) {
            startingPlayer = 2;
            playerDetermined = true;
          }
        }

        // Check guest ID - this is the most common case for guest players
        if (!playerDetermined && socketData.playerId) {
          if (game.player1GuestId && game.player1GuestId === socketData.playerId) {
            startingPlayer = 1;
            playerDetermined = true;
          } else if (game.player2GuestId && game.player2GuestId === socketData.playerId) {
            startingPlayer = 2;
            playerDetermined = true;
          }
        }

        // If still not determined, default to player1 (host)
        if (!playerDetermined) {
          startingPlayer = 1;
        }

        // Start the game with the player who clicked start going first
        game.gameStatus = 'playing';
        game.currentPlayer = startingPlayer;
        await game.save();

        // Emit to lobby about game status change
        io.emit('game-status-updated', {
          roomId: game.roomId,
          roomCode: game.roomCode,
          gameStatus: 'playing',
          displayStatus: 'playing',
          playerCount: 2,
          isFull: true,
        });

        io.to(roomId).emit('game-started', {
          currentPlayer: game.currentPlayer,
        });
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // Surrender
    socket.on('surrender', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        // Determine winner (opponent)
        let winner: PlayerNumber = 1;
        if (socketData.userId) {
          // Authenticated user
          if (game.player1?.toString() === socketData.userId) {
            winner = 2;
          }
        } else if (socketData.isGuest && socketData.playerId) {
          // Guest user
          if (game.player1GuestId === socketData.playerId) {
            winner = 2;
          } else if (game.player2GuestId === socketData.playerId) {
            winner = 1;
          }
        }

        game.gameStatus = 'finished';
        game.winner = winner;
        game.finishedAt = new Date();

        if (winner === 1) {
          game.score.player1++;
        } else {
          game.score.player2++;
        }

        await game.save();

        io.to(roomId).emit('game-finished', {
          winner,
          reason: 'Opponent surrendered',
        });
        io.to(roomId).emit('score-updated', { score: game.score });
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // New game
    socket.on('new-game', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }

        // Reset game but keep score
        game.board = Array(game.boardSize)
          .fill(null)
          .map(() => Array(game.boardSize).fill(0));
        game.currentPlayer = 1;
        game.gameStatus = 'playing';
        game.winner = null;
        game.finishedAt = null;

        await game.save();

        io.to(roomId).emit('move-made', {
          move: null,
          board: game.board,
          currentPlayer: game.currentPlayer,
        });
      } catch (error: any) {
        socket.emit('game-error', { message: error.message });
      }
    });

    // Leave room
    // Note: This is called AFTER the API leaveGame has been called
    // So we only need to leave the socket room, not update game state
    socket.on('leave-room', async (data: { roomId: string }) => {
      socket.leave(data.roomId);
      // The API leaveGame already emitted player-left event with proper data
      // We don't need to emit again here to avoid duplicate events
      socketData.currentRoomId = undefined;
    });

    // Disconnect
    // When socket disconnects (browser closed, network issue, etc.)
    // We need to handle player leave through API if they were in a game
    socket.on('disconnect', async () => {
      if (socketData.currentRoomId) {
        const roomId = socketData.currentRoomId;
        const playerId = socketData.userId || socketData.playerId;
        const isGuest = socketData.isGuest || !socketData.userId;
        
        try {
          // Find the game to determine which player is leaving
          const game = await Game.findOne({ roomId });
          if (!game) {
            // Game doesn't exist, nothing to do
            return;
          }

          // Determine which player is leaving
          let isPlayer1 = false;
          let isPlayer2 = false;
          
          if (playerId) {
            // Check if authenticated user is player1 or player2
            if (socketData.userId) {
              isPlayer1 = !!(game.player1 && game.player1.toString() === socketData.userId.toString());
              isPlayer2 = !!(game.player2 && game.player2.toString() === socketData.userId.toString());
            }
            
            // Also check if playerId matches guest IDs
            if (isGuest && playerId) {
              if (game.player1GuestId && game.player1GuestId === playerId) {
                isPlayer1 = true;
              }
              if (game.player2GuestId && game.player2GuestId === playerId) {
                isPlayer2 = true;
              }
            }
          }

          // Only process if player is actually in the game
          if (isPlayer1 || isPlayer2) {
            // Check players BEFORE removing
            const hasPlayer1Before = !!(game.player1 || game.player1GuestId);
            const hasPlayer2Before = !!(game.player2 || game.player2GuestId);
            const wasFinished = game.gameStatus === 'finished';

            // Remove the player from the game
            if (isPlayer1) {
              game.player1 = null;
              game.player1GuestId = null;
            } else if (isPlayer2) {
              game.player2 = null;
              game.player2GuestId = null;
            }

            // Check players AFTER removing
            const hasPlayer1After = !!(game.player1 || game.player1GuestId);
            const hasPlayer2After = !!(game.player2 || game.player2GuestId);
            const hasNoPlayers = !hasPlayer1After && !hasPlayer2After;

            let gameReset = false;
            let hostTransferred = false;

            if (hasNoPlayers) {
              // Case 1: Game finished + cả 2 player rời → lưu vào history và xóa game
              if (game.gameStatus === 'finished' && game.finishedAt) {
                const GameHistory = (await import('../models/GameHistory')).default;
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
                
                // Clean up old history - simplified version for socket disconnect
                // Full cleanup logic is in gameController.leaveGame
                // For disconnect, we just delete the game
                
                await Game.deleteOne({ roomId });
                io.to(roomId).emit('game-deleted', { roomId });
                return;
              } else {
                // Case 3: Game chưa finished + cả 2 player rời → xóa game
                await Game.deleteOne({ roomId });
                io.to(roomId).emit('game-deleted', { roomId });
                return;
              }
            } else {
              // If player1 (host) left and player2 still exists AFTER removal, transfer host to player2
              if (isPlayer1 && hasPlayer2After) {
                // Transfer player2 to player1 (host transfer)
                game.player1 = game.player2;
                game.player1GuestId = game.player2GuestId;
                game.player2 = null;
                game.player2GuestId = null;
                hostTransferred = true;
                console.log(`[socket disconnect] Host transferred: Player2 is now Player1`);
              }

              // Reset game if needed
              if (wasFinished || game.gameStatus === 'playing') {
                game.gameStatus = 'waiting';
                game.winner = null;
                game.finishedAt = null;
                game.board = Array(game.boardSize)
                  .fill(null)
                  .map(() => Array(game.boardSize).fill(0));
                game.currentPlayer = 1;
                gameReset = true;
              }

              await game.save();

              // Emit player-left event with proper data
              io.to(roomId).emit('player-left', {
                playerNumber: isPlayer1 ? 1 : 2,
                roomId,
                hostTransferred: hostTransferred,
                gameReset: gameReset,
              });
            }
          }
        } catch (error: any) {
          console.error('[socket disconnect] Error handling player leave:', error);
          // Still emit player-left event so frontend can reload
          io.to(roomId).emit('player-left', {
            playerId: playerId || 'guest',
            roomId,
          });
        }
      }
    });
  });
};


