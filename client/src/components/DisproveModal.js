import React, { useState } from 'react';
import '../styles/Modal.css';

const DisproveModal = ({ onClose, data, onSubmit }) => {
  const [selectedCard, setSelectedCard] = useState('');
  
  // Get cards that can disprove the suggestion
  const getDisprovingCards = () => {
    if (!data || !data.cards) return [];
    
    return data.cards.filter(card => 
      card === data.suggestion.character || 
      card === data.suggestion.weapon || 
      card === data.suggestion.room
    );
  };
  
  const disprovingCards = getDisprovingCards();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(selectedCard);
    }
    onClose();
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Disprove Suggestion</h2>
        
        <div className="suggestion-info">
          <p>
            <strong>{data?.suggestion?.player || 'A player'}</strong> has suggested:
          </p>
          <ul>
            <li><strong>Character:</strong> {data?.suggestion?.character}</li>
            <li><strong>Weapon:</strong> {data?.suggestion?.weapon}</li>
            <li><strong>Room:</strong> {data?.suggestion?.room}</li>
          </ul>
        </div>
        
        {disprovingCards.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <p>Select a card to show:</p>
            <div className="card-selection">
              {disprovingCards.map(card => (
                <div key={card} className="card-option">
                  <input
                    type="radio"
                    id={card}
                    name="disproveCard"
                    value={card}
                    checked={selectedCard === card}
                    onChange={() => setSelectedCard(card)}
                    required
                  />
                  <label htmlFor={card}>{card}</label>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={!selectedCard}
              >
                Show Card
              </button>
            </div>
          </form>
        ) : (
          <div className="no-cards">
            <p>You don't have any cards that can disprove this suggestion.</p>
            <button onClick={onClose} className="submit-btn">
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisproveModal; 