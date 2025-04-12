import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import '../styles/Lobby.css';

const Lobby = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameName, setGameName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const { availableGames, loading, error, fetchGames, createGame, joinGame } = useGame();
  const navigate = useNavigate();

  // Fetch games on component mount
  useEffect(() => {
    fetchGames();
    // Set up interval to refresh games list
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Handle game creation
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!gameName) return;

    const result = await createGame({
      name: gameName,
      maxPlayers,
      isPrivate,
      password: password || undefined
    });

    if (result.success) {
      setShowCreateForm(false);
      setGameName('');
      setMaxPlayers(6);
      setIsPrivate(false);
      setPassword('');
      // Join the created game
      await joinGame(result.gameId);
    }
  };

  // Handle game join
  const handleJoinGame = async (gameId, isPrivateGame) => {
    if (isPrivateGame) {
      setSelectedGameId(gameId);
      setShowPasswordModal(true);
    } else {
      await joinGame(gameId);
    }
  };

  // Handle join with password
  const handleJoinWithPassword = async (e) => {
    e.preventDefault();
    if (selectedGameId) {
      const result = await joinGame(selectedGameId, joinPassword);
      if (result.success) {
        setShowPasswordModal(false);
        setJoinPassword('');
        setSelectedGameId(null);
      }
    }
  };

  return (
    <div className="lobby-container">
      <header className="lobby-header">
        <h1>Clue-Less Game Lobby</h1>
        <div className="user-info">
          <span>Welcome, {currentUser?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="lobby-content">
        <div className="actions-panel">
          <button 
            className="create-game-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create New Game'}
          </button>
        </div>

        {showCreateForm && (
          <div className="create-game-form">
            <h2>Create New Game</h2>
            <form onSubmit={handleCreateGame}>
              <div className="form-group">
                <label htmlFor="gameName">Game Name</label>
                <input
                  type="text"
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter a game name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxPlayers">Max Players</label>
                <select 
                  id="maxPlayers" 
                  value={maxPlayers} 
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                >
                  <option value="3">3 Players</option>
                  <option value="4">4 Players</option>
                  <option value="5">5 Players</option>
                  <option value="6">6 Players</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="isPrivate">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Private Game
                </label>
              </div>
              {isPrivate && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a password"
                    required={isPrivate}
                  />
                </div>
              )}
              <button type="submit" className="create-btn" disabled={loading}>
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </form>
          </div>
        )}

        <div className="games-list">
          <h2>Available Games</h2>
          {loading ? (
            <div className="loading">Loading games...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : availableGames.length === 0 ? (
            <div className="no-games">No games available. Create one!</div>
          ) : (
            <table className="games-table">
              <thead>
                <tr>
                  <th>Game Name</th>
                  <th>Status</th>
                  <th>Players</th>
                  <th>Private</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableGames.map((game) => (
                  <tr key={game.id}>
                    <td>{game.name}</td>
                    <td>{game.status}</td>
                    <td>{game.players}/{game.maxPlayers}</td>
                    <td>{game.private ? 'Yes' : 'No'}</td>
                    <td>
                      <button
                        onClick={() => handleJoinGame(game.id, game.private)}
                        disabled={loading || game.players >= game.maxPlayers}
                        className="join-btn"
                      >
                        {game.players >= game.maxPlayers ? 'Full' : 'Join'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Enter Game Password</h2>
            <form onSubmit={handleJoinWithPassword}>
              <div className="form-group">
                <label htmlFor="joinPassword">Password</label>
                <input
                  type="password"
                  id="joinPassword"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby; 