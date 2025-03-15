/**
 * Socket.io handler for the Clue-Less server
 */

const logger = require('../utils/logger');
const gameService = require('../services/gameService');
const { verifyToken } = require('../utils/auth');

/**
 * Handle socket.io connections and events
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Socket.io client connection
 */
const socketHandler = (io, socket) => {
  // Store user data in socket
  let userData = {
    userId: null,
    username: null,
    gameId: null
  };

  /**
   * Authenticate user with token
   * @param {Object} data - Authentication data with token
   * @param {Function} callback - Callback function
   */
  const authenticate = async (data, callback) => {
    try {
      // Verify token
      const decoded = verifyToken(data.token);
      
      // Store user data in socket
      userData.userId = decoded.userId;
      userData.username = decoded.username;
      
      logger.info(`User authenticated: ${userData.username} (${userData.userId})`);
      
      // Join user's room
      socket.join(`user:${userData.userId}`);
      
      // Send success response
      callback({ success: true });
    } catch (error) {
      logger.error('Authentication error:', error);
      callback({ success: false, error: 'Authentication failed' });
    }
  };

  /**
   * Join a game
   * @param {Object} data - Game data with gameId
   * @param {Function} callback - Callback function
   */
  const joinGame = async (data, callback) => {
    try {
      // Check if user is authenticated
      if (!userData.userId) {
        return callback({ success: false, error: 'Authentication required' });
      }
      
      // Join game
      const result = await gameService.joinGame(data.gameId, userData.userId);
      
      if (result.success) {
        // Leave previous game room if any
        if (userData.gameId) {
          socket.leave(`game:${userData.gameId}`);
        }
        
        // Store game ID in socket
        userData.gameId = data.gameId;
        
        // Join game room
        socket.join(`game:${data.gameId}`);
        
        // Broadcast player joined event to all players in the game
        io.to(`game:${data.gameId}`).emit('PLAYER_JOINED', {
          gameId: data.gameId,
          player: {
            id: userData.userId,
            username: userData.username,
            character: result.character
          }
        });
        
        // Send game state to all players
        io.to(`game:${data.gameId}`).emit('GAME_STATE', {
          gameId: data.gameId,
          ...result.gameState
        });
        
        // Send success response
        callback({ success: true, gameState: result.gameState });
      } else {
        callback({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('Join game error:', error);
      callback({ success: false, error: 'Failed to join game' });
    }
  };

  /**
   * Move character
   * @param {Object} data - Move data with destination
   * @param {Function} callback - Callback function
   */
  const move = async (data, callback) => {
    try {
      // Check if user is authenticated and in a game
      if (!userData.userId || !userData.gameId) {
        return callback({ success: false, error: 'Authentication required or not in a game' });
      }
      
      // Process move
      const result = await gameService.moveCharacter(
        userData.gameId,
        userData.userId,
        data.destination
      );
      
      if (result.success) {
        // Broadcast updated game state to all players in the game
        io.to(`game:${userData.gameId}`).emit('GAME_STATE', {
          gameId: userData.gameId,
          ...result.gameState
        });
        
        // Send success response
        callback({ success: true });
      } else {
        callback({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('Move error:', error);
      callback({ success: false, error: 'Failed to move character' });
    }
  };

  /**
   * Make suggestion
   * @param {Object} data - Suggestion data with character and weapon
   * @param {Function} callback - Callback function
   */
  const makeSuggestion = async (data, callback) => {
    try {
      // Check if user is authenticated and in a game
      if (!userData.userId || !userData.gameId) {
        return callback({ success: false, error: 'Authentication required or not in a game' });
      }
      
      // Process suggestion
      const result = await gameService.makeSuggestion(
        userData.gameId,
        userData.userId,
        data.character,
        data.weapon
      );
      
      if (result.success) {
        // Broadcast updated game state to all players in the game
        io.to(`game:${userData.gameId}`).emit('GAME_STATE', {
          gameId: userData.gameId,
          ...result.gameState
        });
        
        // If there's a player who can disprove
        if (result.disprovingPlayerId) {
          // Send suggestion request to the disproving player
          io.to(`user:${result.disprovingPlayerId}`).emit('SUGGESTION_REQUEST', {
            gameId: userData.gameId,
            suggestingPlayer: userData.userId,
            character: data.character,
            weapon: data.weapon,
            room: result.room,
            matchingCards: result.matchingCards
          });
        } else {
          // Broadcast suggestion result to all players
          io.to(`game:${userData.gameId}`).emit('SUGGESTION_RESULT', {
            gameId: userData.gameId,
            suggestingPlayer: userData.userId,
            wasDisproven: false
          });
        }
        
        // Send success response
        callback({ success: true });
      } else {
        callback({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('Suggestion error:', error);
      callback({ success: false, error: 'Failed to make suggestion' });
    }
  };

  /**
   * Disprove suggestion
   * @param {Object} data - Disproval data with card
   * @param {Function} callback - Callback function
   */
  const disproveSuggestion = async (data, callback) => {
    try {
      // Check if user is authenticated and in a game
      if (!userData.userId || !userData.gameId) {
        return callback({ success: false, error: 'Authentication required or not in a game' });
      }
      
      // Process disproval
      const result = await gameService.disproveSuggestion(
        userData.gameId,
        userData.userId,
        data.card
      );
      
      if (result.success) {
        // Send suggestion result to suggesting player
        io.to(`user:${result.suggestingPlayerId}`).emit('SUGGESTION_RESULT', {
          gameId: userData.gameId,
          suggestingPlayer: result.suggestingPlayerId,
          disprovingPlayer: userData.userId,
          cardRevealed: data.card,
          wasDisproven: true
        });
        
        // Broadcast suggestion result to all other players (without the card)
        socket.to(`game:${userData.gameId}`).emit('SUGGESTION_RESULT', {
          gameId: userData.gameId,
          suggestingPlayer: result.suggestingPlayerId,
          disprovingPlayer: userData.userId,
          wasDisproven: true
        });
        
        // Send success response
        callback({ success: true });
      } else {
        callback({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('Disprove suggestion error:', error);
      callback({ success: false, error: 'Failed to disprove suggestion' });
    }
  };

  /**
   * Make accusation
   * @param {Object} data - Accusation data with character, weapon, and room
   * @param {Function} callback - Callback function
   */
  const makeAccusation = async (data, callback) => {
    try {
      // Check if user is authenticated and in a game
      if (!userData.userId || !userData.gameId) {
        return callback({ success: false, error: 'Authentication required or not in a game' });
      }
      
      // Process accusation
      const result = await gameService.makeAccusation(
        userData.gameId,
        userData.userId,
        data.character,
        data.weapon,
        data.room
      );
      
      // Broadcast accusation result to all players
      io.to(`game:${userData.gameId}`).emit('ACCUSATION_RESULT', {
        gameId: userData.gameId,
        accusingPlayer: userData.userId,
        correct: result.correct,
        gameOver: result.gameOver,
        solution: result.gameOver ? result.solution : null
      });
      
      // If game is over, broadcast final game state
      if (result.gameOver) {
        io.to(`game:${userData.gameId}`).emit('GAME_STATE', {
          gameId: userData.gameId,
          ...result.gameState
        });
      }
      
      // Send success response
      callback({ success: true, correct: result.correct });
    } catch (error) {
      logger.error('Accusation error:', error);
      callback({ success: false, error: 'Failed to make accusation' });
    }
  };

  /**
   * End turn
   * @param {Object} data - End turn data
   * @param {Function} callback - Callback function
   */
  const endTurn = async (data, callback) => {
    try {
      // Check if user is authenticated and in a game
      if (!userData.userId || !userData.gameId) {
        return callback({ success: false, error: 'Authentication required or not in a game' });
      }
      
      // Process end turn
      const result = await gameService.endTurn(userData.gameId, userData.userId);
      
      if (result.success) {
        // Broadcast updated game state to all players
        io.to(`game:${userData.gameId}`).emit('GAME_STATE', {
          gameId: userData.gameId,
          ...result.gameState
        });
        
        // Notify next player of their turn
        io.to(`user:${result.nextPlayerId}`).emit('TURN_NOTIFICATION', {
          gameId: userData.gameId,
          playerId: result.nextPlayerId,
          availableActions: result.availableActions
        });
        
        // Send success response
        callback({ success: true });
      } else {
        callback({ success: false, error: result.error });
      }
    } catch (error) {
      logger.error('End turn error:', error);
      callback({ success: false, error: 'Failed to end turn' });
    }
  };

  /**
   * Handle disconnection
   */
  const disconnect = async () => {
    try {
      logger.info(`Client disconnected: ${socket.id}`);
      
      // If user was in a game, handle leaving
      if (userData.userId && userData.gameId) {
        // Notify other players
        socket.to(`game:${userData.gameId}`).emit('PLAYER_LEFT', {
          gameId: userData.gameId,
          playerId: userData.userId
        });
        
        // Update game state
        await gameService.handleDisconnect(userData.gameId, userData.userId);
      }
    } catch (error) {
      logger.error('Disconnect error:', error);
    }
  };

  // Register event handlers
  socket.on('authenticate', authenticate);
  socket.on('JOIN_GAME', joinGame);
  socket.on('MOVE', move);
  socket.on('MAKE_SUGGESTION', makeSuggestion);
  socket.on('DISPROVE_SUGGESTION', disproveSuggestion);
  socket.on('MAKE_ACCUSATION', makeAccusation);
  socket.on('END_TURN', endTurn);
  socket.on('disconnect', disconnect);
};

module.exports = socketHandler; 