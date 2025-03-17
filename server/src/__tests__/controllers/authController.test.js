const request = require('supertest');
const { app } = require('../../index');
const userService = require('../../services/userService');
const { generateToken, hashPassword } = require('../../utils/auth');

// Mock the user service
jest.mock('../../services/userService');
jest.mock('../../utils/logger');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com'
      };

      userService.findUserByUsername.mockResolvedValue(null);
      userService.findUserByEmail.mockResolvedValue(null);
      userService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'User registered successfully',
        userId: mockUser.id
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Username, email, and password are required'
      });
    });

    it('should return 409 if username already exists', async () => {
      userService.findUserByUsername.mockResolvedValue({ id: '1', username: 'testuser' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        message: 'Username already exists'
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: await hashPassword('password123')
      };

      userService.findUserByUsername.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        userId: mockUser.id,
        username: mockUser.username
      });
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3); // JWT format check
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Username and password are required'
      });
    });

    it('should return 401 if user does not exist', async () => {
      userService.findUserByUsername.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid username or password'
      });
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: await hashPassword('correctpassword')
      };

      userService.findUserByUsername.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid username or password'
      });
    });
  });
}); 