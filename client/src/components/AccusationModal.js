import React, { useState } from 'react';
import '../styles/Modal.css';

const AccusationModal = ({ onClose, onSubmit }) => {
  const [accusation, setAccusation] = useState({
    character: '',
    weapon: '',
    room: ''
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

  const rooms = [
    'Kitchen',
    'Ballroom',
    'Conservatory',
    'Billiard Room',
    'Library',
    'Study',
    'Hall',
    'Lounge',
    'Dining Room'
  ];

  const handleChange = (e) => {
    setAccusation({
      ...accusation,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(accusation);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Make an Accusation</h2>
        <p className="warning">Warning: If your accusation is incorrect, you will lose the game!</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="character">Character:</label>
            <select 
              id="character"
              name="character"
              value={accusation.character}
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
              value={accusation.weapon}
              onChange={handleChange}
              required
            >
              <option value="">Select a weapon</option>
              {weapons.map(weapon => (
                <option key={weapon} value={weapon}>{weapon}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="room">Room:</label>
            <select 
              id="room"
              name="room"
              value={accusation.room}
              onChange={handleChange}
              required
            >
              <option value="">Select a room</option>
              {rooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn danger"
              disabled={!accusation.character || !accusation.weapon || !accusation.room}
            >
              Make Accusation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccusationModal; 