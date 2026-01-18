/**
 * Cleanup script to remove stale games from the database
 *
 * Removes:
 * 1. Games with status 'waiting' older than 24 hours (abandoned lobbies)
 * 2. Games with status 'playing' older than 6 hours (stuck games)
 * 3. Games with no players (orphaned games)
 *
 * Run: npm run cleanup:games
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../models/Game';

dotenv.config();

interface CleanupResult {
  waitingOld: number;
  playingStuck: number;
  noPlayers: number;
  total: number;
}

const cleanupStaleGames = async (): Promise<CleanupResult> => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // 1. Remove waiting games older than 24 hours
    const waitingResult = await Game.deleteMany({
      gameStatus: 'waiting',
      createdAt: { $lt: oneDayAgo },
    });
    console.log(`Deleted ${waitingResult.deletedCount} old waiting games (>24h)`);

    // 2. Remove playing games older than 6 hours (stuck/abandoned mid-game)
    const playingResult = await Game.deleteMany({
      gameStatus: 'playing',
      createdAt: { $lt: sixHoursAgo },
    });
    console.log(`Deleted ${playingResult.deletedCount} stuck playing games (>6h)`);

    // 3. Remove orphaned games (no players at all)
    const orphanResult = await Game.deleteMany({
      player1: null,
      player2: null,
      player1GuestId: null,
      player2GuestId: null,
    });
    console.log(`Deleted ${orphanResult.deletedCount} orphaned games (no players)`);

    const result: CleanupResult = {
      waitingOld: waitingResult.deletedCount,
      playingStuck: playingResult.deletedCount,
      noPlayers: orphanResult.deletedCount,
      total: waitingResult.deletedCount + playingResult.deletedCount + orphanResult.deletedCount,
    };

    console.log(`\nCleanup complete! Total deleted: ${result.total} games`);

    // Show remaining games summary
    const remainingGames = await Game.aggregate([
      { $group: { _id: '$gameStatus', count: { $sum: 1 } } },
    ]);
    console.log('\nRemaining games by status:');
    remainingGames.forEach((g) => {
      console.log(`  ${g._id}: ${g.count}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

    return result;
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
};

// Run cleanup if called directly
if (require.main === module) {
  cleanupStaleGames()
    .then((result) => {
      console.log('\nCleanup script completed successfully');
      console.log(`Summary: ${result.total} games removed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

export default cleanupStaleGames;
