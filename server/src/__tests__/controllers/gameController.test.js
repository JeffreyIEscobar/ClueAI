const gameService = require('../../services/gameService');
const { listGames, createGame, getGame, joinGame } = require('../../controllers/gameController');

// Mock the game service
jest.mock('../../services/gameService');

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger');

describe('Game Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request and response mocks
    mockReq = {
      body: {},
      params: {},
      user: { userId: 'test-user-id' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('listGames', () => {
    it('should return list of games successfully', async () => {
      const mockGames = [
        { id: 'game1', name: 'Test Game 1' },
        { id: 'game2', name: 'Test Game 2' }
      ];
      
      gameService.listGames.mockResolvedValue(mockGames);

      await listGames(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        games: mockGames
      });
    });

    it('should handle errors', async () => {
      gameService.listGames.mockRejectedValue(new Error('Database error'));

      await listGames(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error listing games'
      });
    });
  });

  describe('createGame', () => {
    it('should create game successfully', async () => {
      const gameData = {
        name: 'New Game',
        maxPlayers: 4,
        isPrivate: true,
        password: 'secret'
      };
      
      mockReq.body = gameData;
      
      const mockGame = {
        id: 'new-game-id',
        joinCode: 'ABC123'
      };
      
      gameService.createGame.mockResolvedValue(mockGame);

      await createGame(mockReq, mockRes);

      expect(gameService.createGame).toHaveBeenCalledWith({
        name: gameData.name,
        maxPlayers: gameData.maxPlayers,
        private: gameData.isPrivate,
        password: gameData.password,
        createdBy: mockReq.user.userId
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        gameId: mockGame.id,
        joinCode: mockGame.joinCode
      });
    });

    it('should handle missing game name', async () => {
      mockReq.body = { maxPlayers: 4 };

      await createGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Game name is required'
      });
    });

    it('should use default values for optional fields', async () => {
      mockReq.body = { name: 'New Game' };
      
      const mockGame = {
        id: 'new-game-id',
        joinCode: 'ABC123'
      };
      
      gameService.createGame.mockResolvedValue(mockGame);

      await createGame(mockReq, mockRes);

      expect(gameService.createGame).toHaveBeenCalledWith({
        name: 'New Game',
        maxPlayers: 6,
        private: false,
        password: undefined,
        createdBy: mockReq.user.userId
      });
    });

    it('should handle errors', async () => {
      mockReq.body = { name: 'New Game' };
      gameService.createGame.mockRejectedValue(new Error('Database error'));

      await createGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating game'
      });
    });
  });

  describe('getGame', () => {
    it('should return game details for public game', async () => {
      const mockGame = {
        id: 'game-id',
        name: 'Test Game',
        private: false,
        players: []
      };
      
      mockReq.params.gameId = 'game-id';
      gameService.getGame.mockResolvedValue(mockGame);

      await getGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        game: mockGame
      });
    });

    it('should return game details for private game if user is player', async () => {
      const mockGame = {
        id: 'game-id',
        name: 'Test Game',
        private: true,
        players: [{ id: 'test-user-id' }]
      };
      
      mockReq.params.gameId = 'game-id';
      gameService.getGame.mockResolvedValue(mockGame);

      await getGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        game: mockGame
      });
    });

    it('should deny access to private game for non-players', async () => {
      const mockGame = {
        id: 'game-id',
        name: 'Test Game',
        private: true,
        players: [{ id: 'other-user-id' }]
      };
      
      mockReq.params.gameId = 'game-id';
      gameService.getGame.mockResolvedValue(mockGame);

      await getGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You are not authorized to view this game'
      });
    });

    it('should handle non-existent game', async () => {
      mockReq.params.gameId = 'non-existent';
      gameService.getGame.mockResolvedValue(null);

      await getGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Game not found'
      });
    });

    it('should handle errors', async () => {
      mockReq.params.gameId = 'game-id';
      gameService.getGame.mockRejectedValue(new Error('Database error'));

      await getGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error getting game'
      });
    });
  });

  describe('joinGame', () => {
    it('should join game successfully', async () => {
      mockReq.params.gameId = 'game-id';
      mockReq.body = { password: 'secret' };
      
      const mockResult = {
        success: true,
        gameState: { id: 'game-id', players: [] }
      };
      
      gameService.joinGame.mockResolvedValue(mockResult);

      await joinGame(mockReq, mockRes);

      expect(gameService.joinGame).toHaveBeenCalledWith(
        'game-id',
        'test-user-id',
        'secret'
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        gameId: 'game-id',
        initialState: mockResult.gameState
      });
    });

    it('should handle join game failure', async () => {
      mockReq.params.gameId = 'game-id';
      
      const mockResult = {
        success: false,
        error: 'Game is full'
      };
      
      gameService.joinGame.mockResolvedValue(mockResult);

      await joinGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Game is full'
      });
    });

    it('should handle errors', async () => {
      mockReq.params.gameId = 'game-id';
      gameService.joinGame.mockRejectedValue(new Error('Database error'));

      await joinGame(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error joining game'
      });
    });
  });
}); 