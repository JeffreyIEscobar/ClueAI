// Set test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock the database connection
jest.mock('../utils/database', () => ({
  connect: jest.fn().mockResolvedValue(null),
  disconnect: jest.fn().mockResolvedValue(null)
}));

// Mock the logger to avoid console output during tests
jest.mock('../utils/logger');

// Mock the server module
jest.mock('../index', () => {
  const mockExpress = jest.requireActual('express');
  const mockApp = mockExpress();
  const mockServer = require('http').createServer(mockApp);
  
  // Set up middleware
  mockApp.use(mockExpress.json());
  mockApp.use(require('cors')());
  mockApp.use('/api', require('../controllers/routes'));
  
  return { app: mockApp, server: mockServer };
});

// Global beforeAll and afterAll hooks
beforeAll(async () => {
  // Server is already set up in the mock
});

afterAll(async () => {
  const { server } = require('../index');
  
  // Close the Express server
  await new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });

  // Close any remaining handles
  await new Promise(resolve => setTimeout(resolve, 500));
}); 