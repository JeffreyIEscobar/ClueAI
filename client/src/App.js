/**
 * Main App component for the Clue-Less client
 */

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Game from './components/Game';
import NotFound from './components/NotFound';
import { GameProvider } from './contexts/GameContext';
import { SocketProvider } from './contexts/SocketContext';
import './styles/App.css';

const App = () => {
  const [socket] = useState(null);

  return (
    <div className="app">
        <SocketProvider socket={socket}>
          <GameProvider>
            <Routes>
            <Route path="/" element={<Game />} />
            <Route path="/game" element={<Game />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GameProvider>
        </SocketProvider>
    </div>
  );
};

export default App; 