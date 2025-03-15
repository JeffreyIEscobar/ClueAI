/**
 * Database utility for the Clue-Less server
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB database
 * @returns {Promise} Mongoose connection promise
 */
const connectToDatabase = async () => {
  try {
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/clue-less';
    
    // Set mongoose options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Connect to MongoDB
    await mongoose.connect(connectionString, options);
    
    // Log successful connection
    logger.info('Connected to MongoDB');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise} Mongoose disconnection promise
 */
const disconnectFromDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
}; 