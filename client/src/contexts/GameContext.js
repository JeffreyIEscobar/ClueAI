import React, { createContext, useContext, useState } from 'react';

// Create context
const GameContext = createContext(null);

// Provider component
export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);

  const value = {
    gameState,
    setGameState,
    error,
    setError
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 