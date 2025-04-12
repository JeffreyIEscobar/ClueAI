import React from 'react';
import '../styles/GameBoard.css';

const GameBoard = ({ rooms, hallways, players, currentUserId, onRoomClick, currentTurn }) => {
  // Get player by position
  const getPlayerInPosition = (position) => {
    return players.find(player => player.position === position);
  };
  
  // Handle clicking on a space (room or hallway)
  const handleSpaceClick = (position) => {
    // Check if current player's turn and position is a valid move
    if (onRoomClick) {
      onRoomClick(position);
    }
  };
  
  // Get character's display name (short form)
  const getCharacterDisplay = (character) => {
    const initials = character.split(' ').map(word => word[0]).join('');
    return initials;
  };

  // Get color for character
  const getCharacterColor = (character) => {
    const colorMap = {
      'Colonel Mustard': '#E6C700',
      'Miss Scarlet': '#FF2400',
      'Professor Plum': '#8E4585',
      'Mr. Green': '#008000',
      'Mrs. White': '#FFFFFF',
      'Mrs. Peacock': '#002366'
    };
    
    return colorMap[character] || '#888888';
  };

  // Render player token
  const renderPlayerToken = (player) => {
    if (!player) return null;
    
    const isCurrentPlayer = player.userId === currentUserId;
    const isPlayerTurn = player.userId === currentTurn;
    const color = getCharacterColor(player.character);
    const textColor = ['#FFFFFF', '#E6C700'].includes(color) ? '#000000' : '#FFFFFF';
    
    return (
      <div 
        className={`player-token ${isCurrentPlayer ? 'current-player' : ''} ${isPlayerTurn ? 'active-turn' : ''}`}
        style={{ backgroundColor: color, color: textColor }}
        title={player.character}
      >
        {getCharacterDisplay(player.character)}
      </div>
    );
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        {/* Top Row */}
        <div className="room" onClick={() => handleSpaceClick('study')}>
          <div className="room-name">Study</div>
          {getPlayerInPosition('study') && renderPlayerToken(getPlayerInPosition('study'))}
        </div>
        <div className="hallway horizontal" onClick={() => handleSpaceClick('study-hall')}>
          {getPlayerInPosition('study-hall') && renderPlayerToken(getPlayerInPosition('study-hall'))}
        </div>
        <div className="room" onClick={() => handleSpaceClick('hall')}>
          <div className="room-name">Hall</div>
          {getPlayerInPosition('hall') && renderPlayerToken(getPlayerInPosition('hall'))}
        </div>
        <div className="hallway horizontal" onClick={() => handleSpaceClick('hall-lounge')}>
          {getPlayerInPosition('hall-lounge') && renderPlayerToken(getPlayerInPosition('hall-lounge'))}
        </div>
        <div className="room" onClick={() => handleSpaceClick('lounge')}>
          <div className="room-name">Lounge</div>
          {getPlayerInPosition('lounge') && renderPlayerToken(getPlayerInPosition('lounge'))}
        </div>

        {/* Vertical Hallways after Top Row */}
        <div className="hallway vertical" onClick={() => handleSpaceClick('study-library')}>
          {getPlayerInPosition('study-library') && renderPlayerToken(getPlayerInPosition('study-library'))}
        </div>
        <div className="empty"></div>
        <div className="hallway vertical" onClick={() => handleSpaceClick('hall-billiard')}>
          {getPlayerInPosition('hall-billiard') && renderPlayerToken(getPlayerInPosition('hall-billiard'))}
        </div>
        <div className="empty"></div>
        <div className="hallway vertical" onClick={() => handleSpaceClick('lounge-dining')}>
          {getPlayerInPosition('lounge-dining') && renderPlayerToken(getPlayerInPosition('lounge-dining'))}
        </div>

        {/* Middle Row */}
        <div className="room" onClick={() => handleSpaceClick('library')}>
          <div className="room-name">Library</div>
          {getPlayerInPosition('library') && renderPlayerToken(getPlayerInPosition('library'))}
        </div>
        <div className="hallway horizontal" onClick={() => handleSpaceClick('library-billiard')}>
          {getPlayerInPosition('library-billiard') && renderPlayerToken(getPlayerInPosition('library-billiard'))}
        </div>
        <div className="room" onClick={() => handleSpaceClick('billiard')}>
          <div className="room-name">Billiard Room</div>
          {getPlayerInPosition('billiard') && renderPlayerToken(getPlayerInPosition('billiard'))}
        </div>
        <div className="hallway horizontal" onClick={() => handleSpaceClick('billiard-dining')}>
          {getPlayerInPosition('billiard-dining') && renderPlayerToken(getPlayerInPosition('billiard-dining'))}
        </div>
        <div className="room" onClick={() => handleSpaceClick('dining')}>
          <div className="room-name">Dining Room</div>
          {getPlayerInPosition('dining') && renderPlayerToken(getPlayerInPosition('dining'))}
        </div>

        {/* Vertical Hallways after Middle Row */}
        <div className="hallway vertical" onClick={() => handleSpaceClick('library-conservatory')}>
          {getPlayerInPosition('library-conservatory') && renderPlayerToken(getPlayerInPosition('library-conservatory'))}
        </div>
        <div className="empty"></div>
        <div className="hallway vertical" onClick={() => handleSpaceClick('billiard-ballroom')}>
          {getPlayerInPosition('billiard-ballroom') && renderPlayerToken(getPlayerInPosition('billiard-ballroom'))}
        </div>
        <div className="empty"></div>
        <div className="hallway vertical" onClick={() => handleSpaceClick('dining-kitchen')}>
          {getPlayerInPosition('dining-kitchen') && renderPlayerToken(getPlayerInPosition('dining-kitchen'))}
        </div>

        {/* Bottom Row */}
        <div className="room" onClick={() => handleSpaceClick('conservatory')}>
          <div className="room-name">Conservatory</div>
          {getPlayerInPosition('conservatory') && renderPlayerToken(getPlayerInPosition('conservatory'))}
        </div>
        <div className="hallway horizontal" onClick={() => handleSpaceClick('conservatory-ballroom')}>
          {getPlayerInPosition('conservatory-ballroom') && renderPlayerToken(getPlayerInPosition('conservatory-ballroom'))}
        </div>
        <div className="room" onClick={() => handleSpaceClick('ballroom')}>
          <div className="room-name">Ballroom</div>
          {getPlayerInPosition('ballroom') && renderPlayerToken(getPlayerInPosition('ballroom'))}
        </div>
        <div className="hallway horizontal" onClick={() => handleSpaceClick('ballroom-kitchen')}>
          {getPlayerInPosition('ballroom-kitchen') && renderPlayerToken(getPlayerInPosition('ballroom-kitchen'))}
        </div>
        <div className="room" onClick={() => handleSpaceClick('kitchen')}>
          <div className="room-name">Kitchen</div>
          {getPlayerInPosition('kitchen') && renderPlayerToken(getPlayerInPosition('kitchen'))}
        </div>
      </div>

      {/* Character Starting Positions */}
      <div className="starting-positions">
        <div className="start-position top-left" title="Professor Plum">
          {getPlayerInPosition('start_plum') && renderPlayerToken(getPlayerInPosition('start_plum'))}
        </div>
        <div className="start-position top-right" title="Miss Scarlet">
          {getPlayerInPosition('start_scarlet') && renderPlayerToken(getPlayerInPosition('start_scarlet'))}
        </div>
        <div className="start-position middle-left" title="Mrs. Peacock">
          {getPlayerInPosition('start_peacock') && renderPlayerToken(getPlayerInPosition('start_peacock'))}
        </div>
        <div className="start-position middle-right" title="Colonel Mustard">
          {getPlayerInPosition('start_mustard') && renderPlayerToken(getPlayerInPosition('start_mustard'))}
        </div>
        <div className="start-position bottom-left" title="Mr. Green">
          {getPlayerInPosition('start_green') && renderPlayerToken(getPlayerInPosition('start_green'))}
        </div>
        <div className="start-position bottom-right" title="Mrs. White">
          {getPlayerInPosition('start_white') && renderPlayerToken(getPlayerInPosition('start_white'))}
        </div>
      </div>

      {/* Secret Passages */}
      <div className="secret-passages">
        <div className="passage study-kitchen"></div>
        <div className="passage lounge-conservatory"></div>
      </div>
    </div>
  );
};

export default GameBoard; 