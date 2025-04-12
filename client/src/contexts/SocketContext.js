import React, { createContext } from 'react';

// Create context
const SocketContext = createContext(null);

// Provider component
export const SocketProvider = ({ children, socket }) => {
  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use the socket context
export const useSocket = () => {
  return null;
}; 