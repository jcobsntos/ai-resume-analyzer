const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    // Use MONGODB_URI for MongoDB or fall back to mock for PostgreSQL setup
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
      console.log('No database URI provided. Skipping database connection.');
      return;
    }

    // If it's a PostgreSQL URL, we'll skip MongoDB connection
    if (mongoUri.startsWith('postgresql://') || mongoUri.startsWith('postgres://')) {
      console.log('PostgreSQL URL detected. MongoDB connection skipped.');
      console.log('Note: Update to use PostgreSQL client for production.');
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      // Remove deprecated options
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Don't exit in production if DB connection fails initially
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
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
