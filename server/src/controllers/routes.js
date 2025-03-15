/**
 * API routes for the Clue-Less server
 */

const express = require('express');
const authController = require('./authController');
const gameController = require('./gameController');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Game routes (protected by authentication)
router.get('/games', authenticateToken, gameController.listGames);
router.post('/games', authenticateToken, gameController.createGame);
router.get('/games/:gameId', authenticateToken, gameController.getGame);
router.post('/games/:gameId/join', authenticateToken, gameController.joinGame);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router; 