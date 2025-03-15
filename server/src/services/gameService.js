/**
 * Game service for the Clue-Less server
 */

const Game = require('../models/Game');
const User = require('../models/User');
const logger = require('../utils/logger');
const { comparePassword } = require('../utils/auth');
const gameUtils = require('../utils/gameUtils');

/**
 * List all available games
 * @returns {Promise<Array>} List of games
 */
const listGames = async () => {
  try {
    const games = await Game.find({ status: { $ne: 'COMPLETED' } })
      .select('id name status players maxPlayers private createdAt');
    
    return games.map(game => ({
      id: game.id,
      name: game.name,
      status: game.status,
      players: game.players.length,
      maxPlayers: game.maxPlayers,
      private: game.private,
      createdAt: game.createdAt
    }));
  } catch (error) {
    logger.error('Error listing games:', error);
    throw error;
  }
};

/**
 * Create a new game
 * @param {Object} gameData - Game data
 * @returns {Promise<Object>} Created game
 */
const createGame = async (gameData) => {
  try {
    // Initialize game board
    const board = gameUtils.initializeBoard();
    
    // Create game
    const game = new Game({
      ...gameData,
      board
    });
    
    await game.save();
    return game;
  } catch (error) {
    logger.error('Error creating game:', error);
    throw error;
  }
};

/**
 * Get game by ID
 * @param {string} gameId - Game ID
 * @returns {Promise<Object|null>} Game object or null if not found
 */
const getGame = async (gameId) => {
  try {
    return await Game.findById(gameId);
  } catch (error) {
    logger.error('Error getting game:', error);
    throw error;
  }
};

/**
 * Join a game
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @param {string} password - Game password (if required)
 * @returns {Promise<Object>} Join result
 */
const joinGame = async (gameId, userId, password) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is joinable
    if (game.status === 'COMPLETED') {
      return { success: false, error: 'Game is already completed' };
    }
    
    // Check if game is full
    if (game.players.length >= game.maxPlayers) {
      return { success: false, error: 'Game is full' };
    }
    
    // Check if player is already in the game
    const playerInGame = game.players.find(player => player.userId.toString() === userId);
    if (playerInGame) {
      return {
        success: true,
        gameState: gameUtils.getGameState(game, userId),
        character: playerInGame.character
      };
    }
    
    // Check if game requires password
    if (game.private && game.password) {
      if (!password) {
        return { success: false, error: 'Password required' };
      }
      
      const isPasswordValid = await comparePassword(password, game.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid password' };
      }
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Assign character
    const availableCharacters = gameUtils.getAvailableCharacters(game);
    if (availableCharacters.length === 0) {
      return { success: false, error: 'No characters available' };
    }
    
    const character = availableCharacters[0];
    const position = gameUtils.getStartingPosition(character);
    
    // Add player to game
    game.players.push({
      userId,
      username: user.username,
      character,
      position,
      cards: [],
      active: true,
      connected: true
    });
    
    // If this is the first player, start the game
    if (game.players.length === 1) {
      game.currentTurn = userId;
    }
    
    // If game has enough players and is in WAITING status, start it
    if (game.players.length >= 3 && game.status === 'WAITING') {
      await startGame(game);
    } else {
      await game.save();
    }
    
    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.gamesPlayed': 1 }
    });
    
    return {
      success: true,
      gameState: gameUtils.getGameState(game, userId),
      character
    };
  } catch (error) {
    logger.error('Error joining game:', error);
    throw error;
  }
};

/**
 * Start a game
 * @param {Object} game - Game object
 * @returns {Promise<Object>} Updated game
 */
const startGame = async (game) => {
  try {
    // Set game status to PLAYING
    game.status = 'PLAYING';
    
    // Initialize deck and solution
    const { deck, solution } = gameUtils.initializeDeckAndSolution();
    game.deck = deck;
    game.solution = solution;
    
    // Deal cards to players
    const hands = gameUtils.dealCards(deck, game.players.length);
    game.players.forEach((player, index) => {
      player.cards = hands[index];
    });
    
    // Set current turn to first player
    game.currentTurn = game.players[0].userId;
    
    await game.save();
    return game;
  } catch (error) {
    logger.error('Error starting game:', error);
    throw error;
  }
};

/**
 * Move a character
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @param {string} destination - Destination position
 * @returns {Promise<Object>} Move result
 */
const moveCharacter = async (gameId, userId, destination) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is in progress
    if (game.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in progress' };
    }
    
    // Check if it's the player's turn
    if (game.currentTurn.toString() !== userId) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Get player
    const playerIndex = game.players.findIndex(player => player.userId.toString() === userId);
    if (playerIndex === -1) {
      return { success: false, error: 'Player not in game' };
    }
    
    const player = game.players[playerIndex];
    
    // Validate move
    const isMoveValid = gameUtils.isValidMove(game, player, destination);
    if (!isMoveValid) {
      return { success: false, error: 'Invalid move' };
    }
    
    // Update player position
    player.position = destination;
    
    // If moving to a hallway, update hallway occupancy
    if (destination.startsWith('hallway')) {
      const hallwayIndex = game.board.hallways.findIndex(h => h.id === destination);
      if (hallwayIndex !== -1) {
        game.board.hallways[hallwayIndex].occupiedBy = player.character;
      }
    }
    
    // If moving from a hallway, clear hallway occupancy
    if (player.position.startsWith('hallway')) {
      const hallwayIndex = game.board.hallways.findIndex(h => h.id === player.position);
      if (hallwayIndex !== -1) {
        game.board.hallways[hallwayIndex].occupiedBy = null;
      }
    }
    
    await game.save();
    
    return {
      success: true,
      gameState: gameUtils.getGameState(game, userId)
    };
  } catch (error) {
    logger.error('Error moving character:', error);
    throw error;
  }
};

/**
 * Make a suggestion
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @param {string} character - Suggested character
 * @param {string} weapon - Suggested weapon
 * @returns {Promise<Object>} Suggestion result
 */
const makeSuggestion = async (gameId, userId, character, weapon) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is in progress
    if (game.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in progress' };
    }
    
    // Check if it's the player's turn
    if (game.currentTurn.toString() !== userId) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Get player
    const playerIndex = game.players.findIndex(player => player.userId.toString() === userId);
    if (playerIndex === -1) {
      return { success: false, error: 'Player not in game' };
    }
    
    const player = game.players[playerIndex];
    
    // Check if player is in a room
    if (!player.position.startsWith('room')) {
      return { success: false, error: 'You must be in a room to make a suggestion' };
    }
    
    const room = player.position;
    
    // Move suggested character to the room
    const suggestedCharacterIndex = game.players.findIndex(p => p.character === character);
    if (suggestedCharacterIndex !== -1) {
      game.players[suggestedCharacterIndex].position = room;
    }
    
    // Add suggestion to game history
    game.suggestions.push({
      suggestingPlayer: userId,
      character,
      weapon,
      room
    });
    
    // Find player who can disprove the suggestion
    const { disprovingPlayerId, matchingCards } = gameUtils.findDisprovingPlayer(game, userId, character, weapon, room);
    
    // If a player can disprove, update the suggestion
    if (disprovingPlayerId) {
      const suggestionIndex = game.suggestions.length - 1;
      game.suggestions[suggestionIndex].disprovingPlayer = disprovingPlayerId;
    }
    
    await game.save();
    
    return {
      success: true,
      gameState: gameUtils.getGameState(game, userId),
      disprovingPlayerId,
      matchingCards,
      room
    };
  } catch (error) {
    logger.error('Error making suggestion:', error);
    throw error;
  }
};

/**
 * Disprove a suggestion
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @param {string} card - Card to reveal
 * @returns {Promise<Object>} Disproval result
 */
const disproveSuggestion = async (gameId, userId, card) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is in progress
    if (game.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in progress' };
    }
    
    // Get the latest suggestion
    const suggestion = game.suggestions[game.suggestions.length - 1];
    
    // Check if this player is the one who should disprove
    if (suggestion.disprovingPlayer.toString() !== userId) {
      return { success: false, error: 'You are not the player who should disprove this suggestion' };
    }
    
    // Check if the card is valid
    const player = game.players.find(p => p.userId.toString() === userId);
    if (!player.cards.includes(card)) {
      return { success: false, error: 'You do not have this card' };
    }
    
    // Check if the card matches the suggestion
    if (card !== suggestion.character && card !== suggestion.weapon && card !== suggestion.room) {
      return { success: false, error: 'This card does not match the suggestion' };
    }
    
    // Update the suggestion with the revealed card
    suggestion.cardRevealed = card;
    
    await game.save();
    
    return {
      success: true,
      suggestingPlayerId: suggestion.suggestingPlayer
    };
  } catch (error) {
    logger.error('Error disproving suggestion:', error);
    throw error;
  }
};

/**
 * Make an accusation
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @param {string} character - Accused character
 * @param {string} weapon - Accused weapon
 * @param {string} room - Accused room
 * @returns {Promise<Object>} Accusation result
 */
const makeAccusation = async (gameId, userId, character, weapon, room) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is in progress
    if (game.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in progress' };
    }
    
    // Check if it's the player's turn
    if (game.currentTurn.toString() !== userId) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Check if accusation is correct
    const isCorrect = (
      character === game.solution.character &&
      weapon === game.solution.weapon &&
      room === game.solution.room
    );
    
    // Add accusation to game history
    game.accusations.push({
      accusingPlayer: userId,
      character,
      weapon,
      room,
      correct: isCorrect
    });
    
    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        [`stats.${isCorrect ? 'correctAccusations' : 'incorrectAccusations'}`]: 1
      }
    });
    
    if (isCorrect) {
      // Player wins the game
      game.status = 'COMPLETED';
      game.winner = userId;
      
      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.gamesWon': 1 }
      });
    } else {
      // Player is eliminated from the game
      const playerIndex = game.players.findIndex(player => player.userId.toString() === userId);
      if (playerIndex !== -1) {
        game.players[playerIndex].active = false;
      }
      
      // Check if there's only one active player left
      const activePlayers = game.players.filter(player => player.active);
      if (activePlayers.length === 1) {
        // Last player wins
        game.status = 'COMPLETED';
        game.winner = activePlayers[0].userId;
        
        // Update user stats
        await User.findByIdAndUpdate(activePlayers[0].userId, {
          $inc: { 'stats.gamesWon': 1 }
        });
      } else {
        // Move to next player's turn
        await endTurn(gameId, userId);
      }
    }
    
    await game.save();
    
    return {
      success: true,
      correct: isCorrect,
      gameOver: game.status === 'COMPLETED',
      solution: isCorrect ? game.solution : null,
      gameState: gameUtils.getGameState(game, userId)
    };
  } catch (error) {
    logger.error('Error making accusation:', error);
    throw error;
  }
};

/**
 * End a player's turn
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} End turn result
 */
const endTurn = async (gameId, userId) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is in progress
    if (game.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in progress' };
    }
    
    // Check if it's the player's turn
    if (game.currentTurn.toString() !== userId) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Find next active player
    const activePlayers = game.players.filter(player => player.active);
    const currentPlayerIndex = activePlayers.findIndex(player => player.userId.toString() === userId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];
    
    // Update current turn
    game.currentTurn = nextPlayer.userId;
    
    // Determine available actions for next player
    const availableActions = gameUtils.getAvailableActions(game, nextPlayer);
    
    await game.save();
    
    return {
      success: true,
      gameState: gameUtils.getGameState(game, userId),
      nextPlayerId: nextPlayer.userId,
      availableActions
    };
  } catch (error) {
    logger.error('Error ending turn:', error);
    throw error;
  }
};

/**
 * Handle player disconnection
 * @param {string} gameId - Game ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Disconnection result
 */
const handleDisconnect = async (gameId, userId) => {
  try {
    // Get game
    const game = await Game.findById(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Update player connection status
    const playerIndex = game.players.findIndex(player => player.userId.toString() === userId);
    if (playerIndex !== -1) {
      game.players[playerIndex].connected = false;
    }
    
    // If it was this player's turn, end their turn
    if (game.currentTurn.toString() === userId) {
      await endTurn(gameId, userId);
    } else {
      await game.save();
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error handling disconnection:', error);
    throw error;
  }
};

module.exports = {
  listGames,
  createGame,
  getGame,
  joinGame,
  moveCharacter,
  makeSuggestion,
  disproveSuggestion,
  makeAccusation,
  endTurn,
  handleDisconnect
}; 