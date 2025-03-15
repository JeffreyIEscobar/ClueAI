/**
 * User service for the Clue-Less server
 */

const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Find a user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
const findUserByUsername = async (username) => {
  try {
    return await User.findOne({ username });
  } catch (error) {
    logger.error('Error finding user by username:', error);
    throw error;
  }
};

/**
 * Find a user by email
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    logger.error('Error finding user by email:', error);
    throw error;
  }
};

/**
 * Find a user by ID
 * @param {string} id - User ID to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
const findUserById = async (id) => {
  try {
    return await User.findById(id);
  } catch (error) {
    logger.error('Error finding user by ID:', error);
    throw error;
  }
};

/**
 * Update user statistics
 * @param {string} userId - User ID
 * @param {Object} stats - Statistics to update
 * @returns {Promise<Object>} Updated user
 */
const updateUserStats = async (userId, stats) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update stats
    Object.keys(stats).forEach(key => {
      if (user.stats.hasOwnProperty(key)) {
        user.stats[key] += stats[key];
      }
    });
    
    await user.save();
    return user;
  } catch (error) {
    logger.error('Error updating user stats:', error);
    throw error;
  }
};

module.exports = {
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateUserStats
}; 