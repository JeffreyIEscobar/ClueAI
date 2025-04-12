/**
 * Clue-Less Server
 * Main entry point for the server subsystem
 */

// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const routes = require('./controllers/routes');
const socketHandler = require('./controllers/socketHandler');
const { connectToDatabase } = require('./utils/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  socketHandler(io, socket);
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Connect to database
  try {
    await connectToDatabase();
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server }; 