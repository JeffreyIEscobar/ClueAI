import React from 'react';
import '../styles/PlayerInfo.css';

const PlayerInfo = ({ players, currentTurn, currentUserId }) => {
  if (!players || players.length === 0) {
    return <div className="player-info">No players in the game</div>;
  }

  return (
    <div className="player-info">
      <h2>Players</h2>
      <div className="player-list">
        {players.map((player) => (
          <div 
            key={player.userId} 
            className={`player-item ${player.userId === currentTurn ? 'current-turn' : ''} ${player.userId === currentUserId ? 'current-player' : ''}`}
          >
            <div className="player-character">{player.character}</div>
            <div className="player-name">{player.username}</div>
            {player.userId === currentTurn && <div className="turn-indicator">Current Turn</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerInfo; 