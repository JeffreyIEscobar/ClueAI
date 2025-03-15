/**
 * User model for the Clue-Less server
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
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
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    correctAccusations: {
      type: Number,
      default: 0
    },
    incorrectAccusations: {
      type: Number,
      default: 0
    }
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User; 