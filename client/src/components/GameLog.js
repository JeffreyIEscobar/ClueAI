import React from 'react';
import '../styles/GameLog.css';

const GameLog = ({ log }) => {
  return (
    <div className="game-log">
      <h2>Game Log</h2>
      <div className="log-entries">
        {log && log.length > 0 ? (
          log.map((entry, index) => (
            <div key={index} className={`log-entry ${entry.type}`}>
              <div className="log-player">{entry.player}</div>
              <div className="log-content">{entry.content}</div>
              <div className="log-time">
                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-log">No actions have been taken yet</div>
        )}
      </div>
    </div>
  );
};

export default GameLog; 