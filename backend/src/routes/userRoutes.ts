import { Router } from 'express';
import {
  getUserProfile,
  getUserGames,
  getUserGameStats,
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyAchievements,
  getAllAchievementsList,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Current user routes (protected) - MUST be before :userId routes
router.get('/me/profile', authMiddleware, getMyProfile);
router.put('/me/profile', authMiddleware, updateMyProfile);
router.put('/me/password', authMiddleware, changePassword);
router.get('/me/achievements', authMiddleware, getMyAchievements);

// Get all achievements list (public)
router.get('/achievements', getAllAchievementsList);

// Get user profile
router.get('/:userId/profile', getUserProfile);

// Get all game stats for a user
router.get('/:userId/games', getUserGames);

// Get user stats for a specific game
router.get('/:userId/games/:gameId', getUserGameStats);

export default router;
