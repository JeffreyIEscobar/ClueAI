const jwt = require('jsonwebtoken');
const {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateToken
} = require('../../utils/auth');

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger');

describe('Auth Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: '123', username: 'testuser' };
      const token = generateToken(user);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format check

      // Verify the token contents
      const decoded = jwt.decode(token);
      expect(decoded).toMatchObject({
        userId: user.id,
        username: user.username
      });
    });

    it('should handle invalid user objects', () => {
      const mockLogger = require('../../utils/logger');
      
      expect(generateToken(null)).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
      
      expect(generateToken({ username: 'test' })).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
      
      expect(generateToken({ id: '123' })).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user = { id: '123', username: 'testuser' };
      const token = generateToken(user);
      const decoded = verifyToken(token);

      expect(decoded).toMatchObject({
        userId: user.id,
        username: user.username
      });
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: '123', username: 'testuser' },
        process.env.JWT_SECRET || 'clue-less-secret-key',
        { expiresIn: '0s' }
      );

      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);

      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true); // bcrypt hash format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      const result = await comparePassword('wrongpassword', hash);

      expect(result).toBe(false);
    });
  });

  describe('authenticateToken middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should authenticate valid token', () => {
      const user = { id: '123', username: 'testuser' };
      const token = generateToken(user);
      mockReq.headers.authorization = `Bearer ${token}`;

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toMatchObject({
        userId: user.id,
        username: user.username
      });
    });

    it('should return 401 if no token provided', () => {
      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      mockReq.headers.authorization = 'malformed-header';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 