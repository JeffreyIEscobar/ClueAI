import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock api module that AuthContext depends on
jest.mock('../../utils/api', () => ({
  post: jest.fn(),
  defaults: {
    headers: {
      common: {}
    }
  }
}), { virtual: true });

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = mockLocalStorage;

// Mock navigate
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const AllTheProviders = ({ children }) => {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export { customRender as render, mockLocalStorage, mockNavigate };
export * from '@testing-library/react';

// Dummy test to satisfy Jest's requirement
describe('test-utils', () => {
  it('exists', () => {
    expect(true).toBe(true);
  });
}); 