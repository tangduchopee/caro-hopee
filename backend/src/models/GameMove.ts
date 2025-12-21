import mongoose, { Document, Schema } from 'mongoose';

export interface IGameMove extends Document {
  gameId: mongoose.Types.ObjectId;
  player: 1 | 2;
  row: number;
  col: number;
  moveNumber: number;
  timestamp: Date;
  isUndone: boolean;
}

const GameMoveSchema: Schema = new Schema({
  gameId: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  player: {
    type: Number,
    enum: [1, 2],
    required: true,
  },
  row: {
    type: Number,
    required: true,
  },
  col: {
    type: Number,
    required: true,
  },
  moveNumber: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isUndone: {
    type: Boolean,
    default: false,
  },
});

/**
 * Critical Issue C2: Add compound indexes for query performance
 * Without these, queries degrade O(n) as games progress
 */

// For move count queries (gameEngine.ts:54) - used on every move
GameMoveSchema.index({ gameId: 1, isUndone: 1 });

// For undo lookup queries (gameEngine.ts:110) - used for undo operations
GameMoveSchema.index({ gameId: 1, moveNumber: 1 });

// For move validation queries (socketService.ts) - find specific move
GameMoveSchema.index({ gameId: 1, row: 1, col: 1, player: 1 });

// For cleanup and history queries - sort by timestamp
GameMoveSchema.index({ gameId: 1, timestamp: -1 });

export default mongoose.model<IGameMove>('GameMove', GameMoveSchema);

