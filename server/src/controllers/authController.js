/**
 * Authentication controller for the Clue-Less server
 */

const logger = require('../utils/logger');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const userService = require('../services/userService');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await userService.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Check if email already exists
    const existingEmail = await userService.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await userService.createUser({
      username,
      email,
      password: hashedPassword
    });
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user.id
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user' 
    });
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Find user
    const user = await userService.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return success response
    res.status(200).json({
      success: true,
      token,
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error logging in' 
    });
  }
};

module.exports = {
  register,
  login
}; 