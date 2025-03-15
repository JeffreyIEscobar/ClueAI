/**
 * Game utilities for the Clue-Less server
 */

// Game constants
const CHARACTERS = ['Colonel Mustard', 'Miss Scarlet', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock'];
const WEAPONS = ['Knife', 'Candlestick', 'Revolver', 'Rope', 'Lead Pipe', 'Wrench'];
const ROOMS = ['Kitchen', 'Ballroom', 'Conservatory', 'Billiard Room', 'Library', 'Study', 'Hall', 'Lounge', 'Dining Room'];

// Character starting positions
const CHARACTER_STARTING_POSITIONS = {
  'Colonel Mustard': 'start_mustard',
  'Miss Scarlet': 'start_scarlet',
  'Professor Plum': 'start_plum',
  'Mr. Green': 'start_green',
  'Mrs. White': 'start_white',
  'Mrs. Peacock': 'start_peacock'
};

// Room connections (hallways and secret passages)
const ROOM_CONNECTIONS = {
  'room_kitchen': {
    hallways: ['hallway_kitchen_ballroom', 'hallway_kitchen_diningroom'],
    secretPassage: 'room_study'
  },
  'room_ballroom': {
    hallways: ['hallway_kitchen_ballroom', 'hallway_ballroom_conservatory', 'hallway_ballroom_billiardroom'],
    secretPassage: null
  },
  'room_conservatory': {
    hallways: ['hallway_ballroom_conservatory', 'hallway_conservatory_billiardroom'],
    secretPassage: 'room_lounge'
  },
  'room_diningroom': {
    hallways: ['hallway_kitchen_diningroom', 'hallway_diningroom_lounge', 'hallway_diningroom_billiardroom'],
    secretPassage: null
  },
  'room_billiardroom': {
    hallways: ['hallway_ballroom_billiardroom', 'hallway_conservatory_billiardroom', 'hallway_diningroom_billiardroom', 'hallway_billiardroom_library'],
    secretPassage: null
  },
  'room_lounge': {
    hallways: ['hallway_diningroom_lounge', 'hallway_lounge_hall'],
    secretPassage: 'room_conservatory'
  },
  'room_library': {
    hallways: ['hallway_billiardroom_library', 'hallway_library_study', 'hallway_library_hall'],
    secretPassage: null
  },
  'room_hall': {
    hallways: ['hallway_lounge_hall', 'hallway_library_hall', 'hallway_hall_study'],
    secretPassage: null
  },
  'room_study': {
    hallways: ['hallway_library_study', 'hallway_hall_study'],
    secretPassage: 'room_kitchen'
  }
};

/**
 * Initialize the game board
 * @returns {Object} Game board
 */
const initializeBoard = () => {
  // Create rooms
  const rooms = ROOMS.map(name => {
    const id = `room_${name.toLowerCase().replace(/\s/g, '')}`;
    const connections = ROOM_CONNECTIONS[id];
    
    return {
      id,
      name,
      adjacentHallways: connections.hallways,
      secretPassage: connections.secretPassage
    };
  });
  
  // Create hallways
  const hallways = [];
  
  // Add hallways between rooms
  Object.keys(ROOM_CONNECTIONS).forEach(roomId => {
    ROOM_CONNECTIONS[roomId].hallways.forEach(hallwayId => {
      if (!hallways.some(h => h.id === hallwayId)) {
        const [room1, room2] = hallwayId.replace('hallway_', '').split('_');
        hallways.push({
          id: hallwayId,
          connectsRooms: [`room_${room1}`, `room_${room2}`],
          occupiedBy: null
        });
      }
    });
  });
  
  return {
    rooms,
    hallways
  };
};

/**
 * Initialize deck and solution
 * @returns {Object} Deck and solution
 */
const initializeDeckAndSolution = () => {
  // Create deck
  const characterCards = [...CHARACTERS];
  const weaponCards = [...WEAPONS];
  const roomCards = [...ROOMS];
  
  // Select solution cards
  const characterIndex = Math.floor(Math.random() * characterCards.length);
  const weaponIndex = Math.floor(Math.random() * weaponCards.length);
  const roomIndex = Math.floor(Math.random() * roomCards.length);
  
  const solution = {
    character: characterCards[characterIndex],
    weapon: weaponCards[weaponIndex],
    room: roomCards[roomIndex]
  };
  
  // Remove solution cards from deck
  characterCards.splice(characterIndex, 1);
  weaponCards.splice(weaponIndex, 1);
  roomCards.splice(roomIndex, 1);
  
  // Combine remaining cards
  const deck = [...characterCards, ...weaponCards, ...roomCards];
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return { deck, solution };
};

/**
 * Deal cards to players
 * @param {Array} deck - Deck of cards
 * @param {number} numPlayers - Number of players
 * @returns {Array} Array of hands
 */
const dealCards = (deck, numPlayers) => {
  const hands = Array(numPlayers).fill().map(() => []);
  
  // Deal cards evenly
  deck.forEach((card, index) => {
    const playerIndex = index % numPlayers;
    hands[playerIndex].push(card);
  });
  
  return hands;
};

/**
 * Get available characters
 * @param {Object} game - Game object
 * @returns {Array} Available characters
 */
const getAvailableCharacters = (game) => {
  const usedCharacters = game.players.map(player => player.character);
  return CHARACTERS.filter(character => !usedCharacters.includes(character));
};

/**
 * Get starting position for a character
 * @param {string} character - Character name
 * @returns {string} Starting position
 */
const getStartingPosition = (character) => {
  return CHARACTER_STARTING_POSITIONS[character];
};

/**
 * Check if a move is valid
 * @param {Object} game - Game object
 * @param {Object} player - Player object
 * @param {string} destination - Destination position
 * @returns {boolean} True if move is valid
 */
const isValidMove = (game, player, destination) => {
  const currentPosition = player.position;
  
  // If player is in a starting position, they can only move to adjacent hallway
  if (currentPosition.startsWith('start_')) {
    // Get adjacent hallway based on character
    const character = player.character;
    const adjacentHallway = getAdjacentHallway(character);
    
    // Check if destination is the adjacent hallway
    if (destination !== adjacentHallway) {
      return false;
    }
    
    // Check if hallway is occupied
    const hallway = game.board.hallways.find(h => h.id === destination);
    return !hallway.occupiedBy;
  }
  
  // If player is in a hallway, they must move to one of the connected rooms
  if (currentPosition.startsWith('hallway_')) {
    const hallway = game.board.hallways.find(h => h.id === currentPosition);
    
    // Check if destination is one of the connected rooms
    return hallway.connectsRooms.includes(destination);
  }
  
  // If player is in a room, they can move to an adjacent hallway or use a secret passage
  if (currentPosition.startsWith('room_')) {
    const room = game.board.rooms.find(r => r.id === currentPosition);
    
    // Check if destination is an adjacent hallway
    if (destination.startsWith('hallway_')) {
      // Check if hallway is adjacent to the room
      if (!room.adjacentHallways.includes(destination)) {
        return false;
      }
      
      // Check if hallway is occupied
      const hallway = game.board.hallways.find(h => h.id === destination);
      return !hallway.occupiedBy;
    }
    
    // Check if destination is a secret passage
    if (destination.startsWith('room_')) {
      return room.secretPassage === destination;
    }
    
    return false;
  }
  
  return false;
};

/**
 * Get adjacent hallway for a character's starting position
 * @param {string} character - Character name
 * @returns {string} Adjacent hallway
 */
const getAdjacentHallway = (character) => {
  switch (character) {
    case 'Colonel Mustard':
      return 'hallway_lounge_hall';
    case 'Miss Scarlet':
      return 'hallway_hall_study';
    case 'Professor Plum':
      return 'hallway_library_study';
    case 'Mr. Green':
      return 'hallway_conservatory_billiardroom';
    case 'Mrs. White':
      return 'hallway_ballroom_billiardroom';
    case 'Mrs. Peacock':
      return 'hallway_kitchen_ballroom';
    default:
      return null;
  }
};

/**
 * Find player who can disprove a suggestion
 * @param {Object} game - Game object
 * @param {string} suggestingPlayerId - Suggesting player ID
 * @param {string} character - Suggested character
 * @param {string} weapon - Suggested weapon
 * @param {string} room - Suggested room
 * @returns {Object} Disproving player ID and matching cards
 */
const findDisprovingPlayer = (game, suggestingPlayerId, character, weapon, room) => {
  // Get suggesting player index
  const suggestingPlayerIndex = game.players.findIndex(player => player.userId.toString() === suggestingPlayerId);
  
  // Check each player in clockwise order
  for (let i = 1; i <= game.players.length - 1; i++) {
    const playerIndex = (suggestingPlayerIndex + i) % game.players.length;
    const player = game.players[playerIndex];
    
    // Skip inactive players
    if (!player.active) {
      continue;
    }
    
    // Check if player has any of the suggested cards
    const matchingCards = player.cards.filter(card => card === character || card === weapon || card === room);
    
    if (matchingCards.length > 0) {
      return {
        disprovingPlayerId: player.userId,
        matchingCards
      };
    }
  }
  
  // No player can disprove
  return {
    disprovingPlayerId: null,
    matchingCards: []
  };
};

/**
 * Get available actions for a player
 * @param {Object} game - Game object
 * @param {Object} player - Player object
 * @returns {Array} Available actions
 */
const getAvailableActions = (game, player) => {
  const actions = ['ACCUSE', 'END_TURN'];
  
  // If player is in a starting position, they can only move
  if (player.position.startsWith('start_')) {
    const adjacentHallway = getAdjacentHallway(player.character);
    const hallway = game.board.hallways.find(h => h.id === adjacentHallway);
    
    if (!hallway.occupiedBy) {
      actions.push('MOVE');
    }
    
    return actions;
  }
  
  // If player is in a hallway, they must move to a room
  if (player.position.startsWith('hallway_')) {
    actions.push('MOVE');
    return actions;
  }
  
  // If player is in a room
  if (player.position.startsWith('room_')) {
    const room = game.board.rooms.find(r => r.id === player.position);
    
    // Check if player can move to an adjacent hallway
    const canMoveToHallway = room.adjacentHallways.some(hallwayId => {
      const hallway = game.board.hallways.find(h => h.id === hallwayId);
      return !hallway.occupiedBy;
    });
    
    if (canMoveToHallway) {
      actions.push('MOVE');
    }
    
    // Check if player can use a secret passage
    if (room.secretPassage) {
      actions.push('MOVE');
    }
    
    // Player can make a suggestion
    actions.push('SUGGEST');
  }
  
  return actions;
};

/**
 * Get game state for a player
 * @param {Object} game - Game object
 * @param {string} userId - User ID
 * @returns {Object} Game state
 */
const getGameState = (game, userId) => {
  // Get player
  const player = game.players.find(p => p.userId.toString() === userId);
  
  // Create player view of the game
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    players: game.players.map(p => ({
      id: p.userId,
      username: p.username,
      character: p.character,
      position: p.position,
      active: p.active,
      connected: p.connected,
      cards: p.userId.toString() === userId ? p.cards : []
    })),
    currentTurn: game.currentTurn,
    board: game.board,
    myCards: player ? player.cards : [],
    availableActions: player && game.currentTurn.toString() === userId ? getAvailableActions(game, player) : [],
    suggestions: game.suggestions.map(s => ({
      suggestingPlayer: s.suggestingPlayer,
      character: s.character,
      weapon: s.weapon,
      room: s.room,
      disprovingPlayer: s.disprovingPlayer,
      cardRevealed: s.suggestingPlayer.toString() === userId ? s.cardRevealed : undefined,
      timestamp: s.timestamp
    })),
    accusations: game.accusations.map(a => ({
      accusingPlayer: a.accusingPlayer,
      character: a.character,
      weapon: a.weapon,
      room: a.room,
      correct: a.correct,
      timestamp: a.timestamp
    })),
    winner: game.winner
  };
};

module.exports = {
  initializeBoard,
  initializeDeckAndSolution,
  dealCards,
  getAvailableCharacters,
  getStartingPosition,
  isValidMove,
  findDisprovingPlayer,
  getAvailableActions,
  getGameState
}; 