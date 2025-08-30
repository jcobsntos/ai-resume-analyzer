const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    // Use MONGODB_URI for production or fallback to local MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/resume_ai_db';
    
    if (!mongoUri) {
      console.error('No MongoDB URI provided. Database connection failed.');
      return;
    }

    console.log('Connecting to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, {
      // Modern connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Don't exit in production, let the app start without DB for debugging
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      console.log('Starting server without database connection...');
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
  } catch (error) {
    console.log('No active MongoDB connection to close');
  }
  process.exit(0);
});

module.exports = connectDatabase;
