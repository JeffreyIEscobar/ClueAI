import React, { useState } from 'react';
import '../styles/Modal.css';

const SuggestionModal = ({ onClose, onSubmit, currentRoom }) => {
  const [suggestion, setSuggestion] = useState({
    character: '',
    weapon: ''
  });

  const characters = [
    'Colonel Mustard',
    'Miss Scarlet',
    'Professor Plum',
    'Mr. Green',
    'Mrs. White',
    'Mrs. Peacock'
  ];

  const weapons = [
    'Knife',
    'Candlestick',
    'Revolver',
    'Rope',
    'Lead Pipe',
    'Wrench'
  ];

  const handleChange = (e) => {
    setSuggestion({
      ...suggestion,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...suggestion,
      room: currentRoom
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Make a Suggestion</h2>
        <p>You are in the <strong>{currentRoom}</strong>.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="character">Character:</label>
            <select 
              id="character"
              name="character"
              value={suggestion.character}
              onChange={handleChange}
              required
            >
              <option value="">Select a character</option>
              {characters.map(character => (
                <option key={character} value={character}>{character}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="weapon">Weapon:</label>
            <select 
              id="weapon"
              name="weapon"
              value={suggestion.weapon}
              onChange={handleChange}
              required
            >
              <option value="">Select a weapon</option>
              {weapons.map(weapon => (
                <option key={weapon} value={weapon}>{weapon}</option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!suggestion.character || !suggestion.weapon}
            >
              Make Suggestion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestionModal; 