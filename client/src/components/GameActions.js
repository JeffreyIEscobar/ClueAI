import React from 'react';
import '../styles/GameActions.css';

const GameActions = ({ 
  isCurrentTurn, 
  availableActions, 
  onMove, 
  onSuggest, 
  onAccuse, 
  onEndTurn,
  playerCards 
}) => {
  return (
    <div className="game-actions">
      <div className="action-panel">
        <h3>Game Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn move-btn" 
            disabled={!isCurrentTurn || !availableActions.canMove} 
            onClick={onMove}
          >
            Move
          </button>
          <button 
            className="action-btn suggest-btn" 
            disabled={!isCurrentTurn || !availableActions.canSuggest} 
            onClick={onSuggest}
          >
            Make Suggestion
          </button>
          <button 
            className="action-btn accuse-btn" 
            disabled={!isCurrentTurn} 
            onClick={onAccuse}
          >
            Make Accusation
          </button>
          <button 
            className="action-btn end-turn-btn" 
            disabled={!isCurrentTurn || !availableActions.canEndTurn} 
            onClick={onEndTurn}
          >
            End Turn
          </button>
        </div>
      </div>

      <div className="cards-panel">
        <h3>Your Cards</h3>
        <div className="player-cards">
          {playerCards.length > 0 ? (
            playerCards.map((card, index) => (
              <div key={index} className="card">
                {card}
              </div>
            ))
          ) : (
            <div className="no-cards">No cards in your hand</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameActions; 