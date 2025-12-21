import mongoose, { Document, Schema } from 'mongoose';

export interface IGameHistory extends Document {
  originalGameId: string; // Reference to original game _id (if needed)
  roomId: string;
  roomCode: string;
  gameType: string;
  player1: mongoose.Types.ObjectId | null;
  player2: mongoose.Types.ObjectId | null;
  player1GuestId: string | null;
  player2GuestId: string | null;
  boardSize: number;
  board: number[][];
  winner: 1 | 2 | null | 'draw';
  score: {
    player1: number;
    player2: number;
  };
  rules: {
    blockTwoEnds: boolean;
    allowUndo: boolean;
    maxUndoPerGame: number;
    timeLimit: number | null;
  };
  finishedAt: Date;
  createdAt: Date; // Original game creation date
  savedAt: Date; // When this history record was created
}

const GameHistorySchema: Schema = new Schema({
  originalGameId: {
    type: String,
    default: null,
  },
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  roomCode: {
    type: String,
    required: true,
  },
  gameType: {
    type: String,
    required: true,
    default: 'caro',
    trim: true,
    lowercase: true,
  },
  player1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  player2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  player1GuestId: {
    type: String,
    default: null,
    index: true,
  },
  player2GuestId: {
    type: String,
    default: null,
    index: true,
  },
  boardSize: {
    type: Number,
    required: true,
  },
  board: {
    type: [[Number]],
    required: true,
  },
  winner: {
    type: Schema.Types.Mixed,
    default: null,
  },
  score: {
    player1: {
      type: Number,
      default: 0,
    },
    player2: {
      type: Number,
      default: 0,
    },
  },
  rules: {
    blockTwoEnds: {
      type: Boolean,
      default: false,
    },
    allowUndo: {
      type: Boolean,
      default: true,
    },
    maxUndoPerGame: {
      type: Number,
      default: 3,
    },
    timeLimit: {
      type: Number,
      default: null,
    },
  },
  finishedAt: {
    type: Date,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes for efficient queries
GameHistorySchema.index({ player1: 1, finishedAt: -1 });
GameHistorySchema.index({ player2: 1, finishedAt: -1 });
GameHistorySchema.index({ player1GuestId: 1, finishedAt: -1 });
GameHistorySchema.index({ player2GuestId: 1, finishedAt: -1 });

export default mongoose.model<IGameHistory>('GameHistory', GameHistorySchema);
