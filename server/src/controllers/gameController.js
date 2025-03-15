/**
 * Game controller for the Clue-Less server
 */

const logger = require('../utils/logger');
const gameService = require('../services/gameService');

/**
 * List all available games
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listGames = async (req, res) => {
  try {
    const games = await gameService.listGames();
    
    res.status(200).json({
      success: true,
      games
    });
  } catch (error) {
    logger.error('List games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing games'
    });
  }
};

/**
 * Create a new game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createGame = async (req, res) => {
  try {
    const { name, maxPlayers, private, password } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Game name is required'
      });
    }
    
    // Create game
    const game = await gameService.createGame({
      name,
      maxPlayers: maxPlayers || 6,
      private: private || false,
      password,
      createdBy: userId
    });
    
    res.status(201).json({
      success: true,
      gameId: game.id,
      joinCode: game.joinCode
    });
  } catch (error) {
    logger.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating game'
    });
  }
};

/**
 * Get game details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGame = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const userId = req.user.userId;
    
    // Get game
    const game = await gameService.getGame(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Check if user is in the game
    const isPlayerInGame = game.players.some(player => player.id === userId);
    
    if (!isPlayerInGame && game.private) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this game'
      });
    }
    
    res.status(200).json({
      success: true,
      game
    });
  } catch (error) {
    logger.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting game'
    });
  }
};

/**
 * Join a game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const joinGame = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const userId = req.user.userId;
    const { password } = req.body;
    
    // Join game
    const result = await gameService.joinGame(gameId, userId, password);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      gameId,
      initialState: result.gameState
    });
  } catch (error) {
    logger.error('Join game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining game'
    });
  }
};

module.exports = {
  listGames,
  createGame,
  getGame,
  joinGame
}; 