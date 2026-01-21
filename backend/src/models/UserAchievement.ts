import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  unlockedAt: Date;
  gameId: string; // Game where achievement was unlocked (e.g., 'caro')
}

const UserAchievementSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  achievementId: {
    type: String,
    required: true,
    trim: true,
  },
  gameId: {
    type: String,
    required: true,
    default: 'caro',
    trim: true,
    lowercase: true,
  },
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique compound index: one achievement per user per game
UserAchievementSchema.index({ userId: 1, achievementId: 1, gameId: 1 }, { unique: true });

// Index for querying user's achievements
UserAchievementSchema.index({ userId: 1, unlockedAt: -1 });

export default mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);
