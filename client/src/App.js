/**
 * Main App component for the Clue-Less client
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Register from './components/Register';
import Lobby from './components/Lobby';
import Game from './components/Game';
import NotFound from './components/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/App.css';

const App = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Clean up socket connection on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <div className="app">
      <AuthProvider>
        <SocketProvider socket={socket}>
          <GameProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/lobby"
                element={
                  <ProtectedRoute>
                    <Lobby />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/:gameId"
                element={
                  <ProtectedRoute>
                    <Game />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GameProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
};

export default App; 