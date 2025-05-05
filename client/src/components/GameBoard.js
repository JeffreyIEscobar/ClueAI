import React from 'react';
import '../styles/GameBoard.css';

// Mapping from position ID to grid coordinates (row, col) - 0-indexed
// const positionToCoords = { ... };
// const getPositionStyle = (position) => { ... };

const GameBoard = ({ rooms, hallways, players, currentUserId, onRoomClick, currentTurn }) => {

  console.log("GameBoard Render: Received players prop:", players);
  console.log("GameBoard Render: Current Turn:", currentTurn);

  // Get player by position
  const getPlayersInPosition = (position) => {
    return players.filter(player => player.position === position);
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

  // Render player token (No longer absolute)
  const renderPlayerToken = (player) => {
    const isCurrentPlayer = player.userId === currentUserId;
    const isPlayerTurn = player.userId === currentTurn;
    const color = getCharacterColor(player.character);
    const textColor = ['#FFFFFF', '#E6C700'].includes(color) ? '#000000' : '#FFFFFF';

    console.log(`GameBoard Render: Rendering ${player.username} at position ${player.position}`);

    return (
      <div
        key={player.userId}
        className={`player-token ${isCurrentPlayer ? 'current-player' : ''} ${isPlayerTurn ? 'active-turn' : ''}`}
        style={{ backgroundColor: color, color: textColor }}
        title={player.character}
      >
        {getCharacterDisplay(player.character)}
      </div>
    );
  };

  // Helper to render tokens for a given position
  const renderTokensForPosition = (position) => {
      const playersInPos = getPlayersInPosition(position);
      return playersInPos.map(player => renderPlayerToken(player));
  };

  return (
    <div className="game-board">
      {/* Render the static grid structure */}
      <div className="board-grid">
        {/* Rebuild grid rendering to include tokens inside cells */}
        {/* Top Row */}
        <div className="room board-cell" onClick={() => handleSpaceClick('study')}>
          <div className="room-name">Study</div>
          {renderTokensForPosition('study')}
        </div>
        <div className="hallway horizontal board-cell" onClick={() => handleSpaceClick('study-hall')}>
           {renderTokensForPosition('study-hall')}
        </div>
        <div className="room board-cell" onClick={() => handleSpaceClick('hall')}>
          <div className="room-name">Hall</div>
           {renderTokensForPosition('hall')}
        </div>
        <div className="hallway horizontal board-cell" onClick={() => handleSpaceClick('hall-lounge')}>
           {renderTokensForPosition('hall-lounge')}
        </div>
        <div className="room board-cell" onClick={() => handleSpaceClick('lounge')}>
          <div className="room-name">Lounge</div>
           {renderTokensForPosition('lounge')}
        </div>

        {/* Vertical Hallways 1 */}
        <div className="hallway vertical board-cell" onClick={() => handleSpaceClick('study-library')}>
           {renderTokensForPosition('study-library')}
        </div>
        <div className="empty board-cell"></div>
        <div className="hallway vertical board-cell" onClick={() => handleSpaceClick('hall-billiard')}>
           {renderTokensForPosition('hall-billiard')}
        </div>
        <div className="empty board-cell"></div>
        <div className="hallway vertical board-cell" onClick={() => handleSpaceClick('lounge-dining')}>
           {renderTokensForPosition('lounge-dining')}
        </div>

        {/* Middle Row */}
        <div className="room board-cell" onClick={() => handleSpaceClick('library')}>
          <div className="room-name">Library</div>
           {renderTokensForPosition('library')}
        </div>
        <div className="hallway horizontal board-cell" onClick={() => handleSpaceClick('library-billiard')}>
           {renderTokensForPosition('library-billiard')}
        </div>
        <div className="room board-cell" onClick={() => handleSpaceClick('billiard')}>
          <div className="room-name">Billiard Room</div>
           {renderTokensForPosition('billiard')}
        </div>
        <div className="hallway horizontal board-cell" onClick={() => handleSpaceClick('billiard-dining')}>
           {renderTokensForPosition('billiard-dining')}
        </div>
        <div className="room board-cell" onClick={() => handleSpaceClick('dining')}>
          <div className="room-name">Dining Room</div>
           {renderTokensForPosition('dining')}
        </div>

        {/* Vertical Hallways 2 */}
        <div className="hallway vertical board-cell" onClick={() => handleSpaceClick('library-conservatory')}>
           {renderTokensForPosition('library-conservatory')}
        </div>
        <div className="empty board-cell"></div>
        <div className="hallway vertical board-cell" onClick={() => handleSpaceClick('billiard-ballroom')}>
           {renderTokensForPosition('billiard-ballroom')}
        </div>
        <div className="empty board-cell"></div>
        <div className="hallway vertical board-cell" onClick={() => handleSpaceClick('dining-kitchen')}>
           {renderTokensForPosition('dining-kitchen')}
        </div>

        {/* Bottom Row */}
        <div className="room board-cell" onClick={() => handleSpaceClick('conservatory')}>
          <div className="room-name">Conservatory</div>
           {renderTokensForPosition('conservatory')}
        </div>
        <div className="hallway horizontal board-cell" onClick={() => handleSpaceClick('conservatory-ballroom')}>
           {renderTokensForPosition('conservatory-ballroom')}
        </div>
        <div className="room board-cell" onClick={() => handleSpaceClick('ballroom')}>
          <div className="room-name">Ballroom</div>
           {renderTokensForPosition('ballroom')}
        </div>
        <div className="hallway horizontal board-cell" onClick={() => handleSpaceClick('ballroom-kitchen')}>
           {renderTokensForPosition('ballroom-kitchen')}
        </div>
        <div className="room board-cell" onClick={() => handleSpaceClick('kitchen')}>
          <div className="room-name">Kitchen</div>
           {renderTokensForPosition('kitchen')}
        </div>
      </div>

      {/* Character Starting Positions */}
      <div className="starting-positions">
        <div className="start-position top-left" title="Professor Plum">
          {/* {getPlayerInPosition('start_plum') && renderPlayerToken(getPlayerInPosition('start_plum'), 0, 1)} */}
        </div>
        <div className="start-position top-right" title="Miss Scarlet">
          {/* {getPlayerInPosition('start_scarlet') && renderPlayerToken(getPlayerInPosition('start_scarlet'), 0, 1)} */}
        </div>
        <div className="start-position middle-left" title="Mrs. Peacock">
          {/* {getPlayerInPosition('start_peacock') && renderPlayerToken(getPlayerInPosition('start_peacock'), 0, 1)} */}
        </div>
        <div className="start-position middle-right" title="Colonel Mustard">
          {/* {getPlayerInPosition('start_mustard') && renderPlayerToken(getPlayerInPosition('start_mustard'), 0, 1)} */}
        </div>
        <div className="start-position bottom-left" title="Mr. Green">
          {/* {getPlayerInPosition('start_green') && renderPlayerToken(getPlayerInPosition('start_green'), 0, 1)} */}
        </div>
        <div className="start-position bottom-right" title="Mrs. White">
          {/* {getPlayerInPosition('start_white') && renderPlayerToken(getPlayerInPosition('start_white'), 0, 1)} */}
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