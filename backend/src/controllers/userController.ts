import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import GameStats from '../models/GameStats';
import GameType from '../models/GameType';
import { AuthRequest } from '../middleware/authMiddleware';

// Valid preset avatar IDs
const VALID_PRESET_AVATARS = [
  'default-1',
  'animal-1', 'animal-2', 'animal-3', 'animal-4', 'animal-5',
  'character-1', 'character-2', 'character-3', 'character-4', 'character-5',
  'abstract-1',
];

/**
 * Get user profile
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      // Legacy fields for backward compatibility
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      totalScore: user.totalScore,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all game stats for a user
 */
export const getUserGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const stats = await GameStats.find({ userId })
      .populate('userId', 'username')
      .sort({ lastPlayed: -1 });

    // Get game type info
    const gameIds = [...new Set(stats.map((s) => s.gameId))];
    const gameTypes = await GameType.find({ gameId: { $in: gameIds } });

    const gameMap = new Map(gameTypes.map((gt) => [gt.gameId, gt]));

    const gameStats = stats.map((stat) => ({
      _id: stat._id,
      gameId: stat.gameId,
      gameName: gameMap.get(stat.gameId)?.name || stat.gameId,
      wins: stat.wins,
      losses: stat.losses,
      draws: stat.draws,
      totalScore: stat.totalScore,
      customStats: Object.fromEntries(stat.customStats || new Map()),
      lastPlayed: stat.lastPlayed,
      createdAt: stat.createdAt,
      updatedAt: stat.updatedAt,
    }));

    res.json({
      userId,
      games: gameStats,
      totalGames: gameStats.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user stats for a specific game
 */
export const getUserGameStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, gameId } = req.params;

    // Verify game exists
    const gameType = await GameType.findOne({ gameId, isActive: true });
    if (!gameType) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    const stats = await GameStats.findOne({ userId, gameId });

    if (!stats) {
      res.json({
        userId,
        gameId,
        gameName: gameType.name,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
        customStats: {},
        lastPlayed: null,
      });
      return;
    }

    res.json({
      _id: stats._id,
      userId: stats.userId,
      gameId: stats.gameId,
      gameName: gameType.name,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      totalScore: stats.totalScore,
      customStats: Object.fromEntries(stats.customStats || new Map()),
      lastPlayed: stats.lastPlayed,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get current user's profile
 */
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar || { type: 'preset', value: 'default-1' },
      settings: user.settings || { language: 'en', emailNotifications: true },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      // Legacy fields for backward compatibility
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      totalScore: user.totalScore,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update current user's profile
 */
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { displayName, bio, avatar, settings } = req.body;

    // Validate displayName
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.length > 30) {
        res.status(400).json({ message: 'Display name must be at most 30 characters' });
        return;
      }
    }

    // Validate bio
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 200) {
        res.status(400).json({ message: 'Bio must be at most 200 characters' });
        return;
      }
    }

    // Validate avatar
    if (avatar !== undefined) {
      if (!avatar.type || !['preset', 'gravatar'].includes(avatar.type)) {
        res.status(400).json({ message: 'Invalid avatar type' });
        return;
      }
      if (avatar.type === 'preset' && !VALID_PRESET_AVATARS.includes(avatar.value)) {
        res.status(400).json({ message: 'Invalid preset avatar' });
        return;
      }
      if (avatar.type === 'gravatar' && typeof avatar.value !== 'string') {
        res.status(400).json({ message: 'Invalid gravatar hash' });
        return;
      }
    }

    // Validate settings
    if (settings !== undefined) {
      if (settings.language && !['en', 'vi'].includes(settings.language)) {
        res.status(400).json({ message: 'Invalid language setting' });
        return;
      }
    }

    // Build update object
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim() || null;
    if (bio !== undefined) updateData.bio = bio.trim() || null;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (settings !== undefined) {
      updateData.settings = settings;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar || { type: 'preset', value: 'default-1' },
      settings: user.settings || { language: 'en', emailNotifications: true },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      totalScore: user.totalScore,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Change current user's password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }

    // Get user with password
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
