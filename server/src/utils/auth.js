/**
 * Authentication utilities for the Clue-Less server
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'clue-less-secret-key';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id and username
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  try {
    const payload = {
      userId: user.id,
      username: user.username
    };
    
    const options = {
      expiresIn: '24h' // Token expires in 24 hours
    };
    
    return jwt.sign(payload, JWT_SECRET, options);
  } catch (error) {
    logger.error('Error generating token:', error);
    throw error;
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error('Error verifying token:', error);
    throw error;
  }
};

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw error;
  }
};

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user data to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateToken
}; 