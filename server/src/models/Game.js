/**
 * Game model for the Clue-Less server
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Define the player schema
const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  character: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  cards: [{
    type: String
  }],
  active: {
    type: Boolean,
    default: true
  },
  connected: {
    type: Boolean,
    default: true
  }
});

// Define the game schema
const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'PLAYING', 'COMPLETED'],
    default: 'WAITING'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  maxPlayers: {
    type: Number,
    default: 6,
    min: 3,
    max: 6
  },
  private: {
    type: Boolean,
    default: false
  },
  password: {
    type: String
  },
  joinCode: {
    type: String,
    default: () => uuidv4().substring(0, 6).toUpperCase()
  },
  players: [playerSchema],
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  board: {
    rooms: [{
      id: String,
      name: String,
      adjacentHallways: [String],
      secretPassage: String
    }],
    hallways: [{
      id: String,
      connectsRooms: [String],
      occupiedBy: String
    }]
  },
  solution: {
    character: String,
    weapon: String,
    room: String
  },
  deck: [String],
  suggestions: [{
    suggestingPlayer: mongoose.Schema.Types.ObjectId,
    character: String,
    weapon: String,
    room: String,
    disprovingPlayer: mongoose.Schema.Types.ObjectId,
    cardRevealed: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  accusations: [{
    accusingPlayer: mongoose.Schema.Types.ObjectId,
    character: String,
    weapon: String,
    room: String,
    correct: Boolean,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update the updatedAt field before saving
gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export the Game model
const Game = mongoose.model('Game', gameSchema);

module.exports = Game; 