import mongoose from 'mongoose';

/**
 * MongoDB connection with production-ready pooling configuration
 * Fixes Critical Issue C1: No Database Connection Pooling
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/caro-game';

    await mongoose.connect(mongoUri, {
      // Connection pool settings for production scale
      maxPoolSize: 100,           // Max 100 connections for HTTP requests
      minPoolSize: 10,            // Always keep 10 connections warm
      maxIdleTimeMS: 30000,       // Close idle connections after 30s
      serverSelectionTimeoutMS: 5000,  // Fail fast on server issues
      socketTimeoutMS: 45000,     // Socket timeout for long operations
      family: 4,                  // Use IPv4 first (faster)

      // Write concern for data safety
      writeConcern: {
        w: 'majority',
        wtimeout: 10000,
      },

      // Read preference for replicated deployments
      readPreference: 'primaryPreferred',
    });

    console.log('MongoDB connected successfully with connection pooling');

    // Monitor connection pool events in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB');
      });
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

