const Game = require('../../models/Game');
const User = require('../../models/User');
const gameUtils = require('../../utils/gameUtils');
const { comparePassword } = require('../../utils/auth');
const gameService = require('../../services/gameService');

// Mock the models and utilities
jest.mock('../../models/Game');
jest.mock('../../models/User');
jest.mock('../../utils/gameUtils');
jest.mock('../../utils/auth');
jest.mock('../../utils/logger');

describe('Game Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listGames', () => {
    it('should list available games', async () => {
      const mockGames = [
        {
          id: 'game1',
          name: 'Test Game 1',
          status: 'WAITING',
          players: [{ id: 'player1' }],
          maxPlayers: 6,
          private: false,
          createdAt: new Date()
        }
      ];

      Game.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockGames)
      });

      const result = await gameService.listGames();

      expect(Game.find).toHaveBeenCalledWith({ status: { $ne: 'COMPLETED' } });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'game1',
        name: 'Test Game 1',
        status: 'WAITING',
        players: 1,
        maxPlayers: 6,
        private: false
      });
    });

    it('should handle database errors', async () => {
      Game.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await expect(gameService.listGames()).rejects.toThrow('Database error');
    });
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      const gameData = {
        name: 'New Game',
        maxPlayers: 6,
        private: false,
        createdBy: 'user1'
      };

      const mockBoard = { rooms: [], hallways: [] };
      gameUtils.initializeBoard.mockReturnValue(mockBoard);

      const mockGame = {
        ...gameData,
        board: mockBoard,
        save: jest.fn().mockResolvedValue(true)
      };

      Game.mockImplementation(() => mockGame);

      const result = await gameService.createGame(gameData);

      expect(gameUtils.initializeBoard).toHaveBeenCalled();
      expect(Game).toHaveBeenCalledWith({
        ...gameData,
        board: mockBoard
      });
      expect(result).toBe(mockGame);
    });

    it('should handle save errors', async () => {
      const gameData = { name: 'New Game' };
      const mockGame = {
        ...gameData,
        save: jest.fn().mockRejectedValue(new Error('Save error'))
      };

      Game.mockImplementation(() => mockGame);

      await expect(gameService.createGame(gameData)).rejects.toThrow('Save error');
    });
  });

  describe('joinGame', () => {
    const mockGame = {
      id: 'game1',
      status: 'WAITING',
      players: [],
      maxPlayers: 6,
      private: true,
      password: 'hashedPassword',
      save: jest.fn().mockResolvedValue(true)
    };

    const mockUser = {
      id: 'user1',
      username: 'testuser'
    };

    beforeEach(() => {
      Game.findById.mockResolvedValue(mockGame);
      User.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      gameUtils.getAvailableCharacters.mockReturnValue(['SCARLET']);
      gameUtils.getStartingPosition.mockReturnValue('STUDY');
      gameUtils.getGameState.mockReturnValue({ state: 'test' });
    });

    it('should join a game successfully', async () => {
      const result = await gameService.joinGame('game1', 'user1', 'password');

      expect(result.success).toBe(true);
      expect(result.gameState).toEqual({ state: 'test' });
      expect(result.character).toBe('SCARLET');
      expect(mockGame.players).toHaveLength(1);
      expect(mockGame.players[0]).toMatchObject({
        userId: 'user1',
        username: 'testuser',
        character: 'SCARLET',
        position: 'STUDY'
      });
    });

    it('should handle full games', async () => {
      mockGame.players = Array(6).fill({ userId: 'other' });

      const result = await gameService.joinGame('game1', 'user1', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game is full');
    });

    it('should handle invalid passwords', async () => {
      comparePassword.mockResolvedValue(false);

      const result = await gameService.joinGame('game1', 'user1', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });

    it('should handle missing password for private game', async () => {
      const result = await gameService.joinGame('game1', 'user1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password required');
    });

    it('should handle non-existent games', async () => {
      Game.findById.mockResolvedValue(null);

      const result = await gameService.joinGame('nonexistent', 'user1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found');
    });

    it('should handle non-existent users', async () => {
      User.findById.mockResolvedValue(null);

      const result = await gameService.joinGame('game1', 'nonexistent', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle no available characters', async () => {
      gameUtils.getAvailableCharacters.mockReturnValue([]);

      const result = await gameService.joinGame('game1', 'user1', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No characters available');
    });

    it('should start game when enough players join', async () => {
      mockGame.players = [
        { userId: 'user2' },
        { userId: 'user3' }
      ];

      const mockDeckAndSolution = {
        deck: ['card1', 'card2'],
        solution: { character: 'PLUM', weapon: 'ROPE', room: 'STUDY' }
      };
      gameUtils.initializeDeckAndSolution.mockReturnValue(mockDeckAndSolution);
      gameUtils.dealCards.mockReturnValue([['card1'], ['card2'], ['card3']]);

      await gameService.joinGame('game1', 'user1', 'password');

      expect(mockGame.status).toBe('PLAYING');
      expect(mockGame.deck).toEqual(mockDeckAndSolution.deck);
      expect(mockGame.solution).toEqual(mockDeckAndSolution.solution);
      expect(mockGame.players[2].cards).toEqual(['card3']);
    });
  });

  describe('getGame', () => {
    it('should return game by ID', async () => {
      const mockGame = { id: 'game1', name: 'Test Game' };
      Game.findById.mockResolvedValue(mockGame);

      const result = await gameService.getGame('game1');

      expect(Game.findById).toHaveBeenCalledWith('game1');
      expect(result).toBe(mockGame);
    });

    it('should handle database errors', async () => {
      Game.findById.mockRejectedValue(new Error('Database error'));

      await expect(gameService.getGame('game1')).rejects.toThrow('Database error');
    });
  });
}); 