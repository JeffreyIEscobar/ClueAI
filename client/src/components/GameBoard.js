import React from 'react';
import '../styles/GameBoard.css';

// Mapping from position ID to grid coordinates (row, col) - 0-indexed
const positionToCoords = {
  'study': { row: 0, col: 0 }, 'study-hall': { row: 0, col: 1 }, 'hall': { row: 0, col: 2 }, 'hall-lounge': { row: 0, col: 3 }, 'lounge': { row: 0, col: 4 },
  'study-library': { row: 1, col: 0 }, 'hall-billiard': { row: 1, col: 2 }, 'lounge-dining': { row: 1, col: 4 },
  'library': { row: 2, col: 0 }, 'library-billiard': { row: 2, col: 1 }, 'billiard': { row: 2, col: 2 }, 'billiard-dining': { row: 2, col: 3 }, 'dining': { row: 2, col: 4 },
  'library-conservatory': { row: 3, col: 0 }, 'billiard-ballroom': { row: 3, col: 2 }, 'dining-kitchen': { row: 3, col: 4 },
  'conservatory': { row: 4, col: 0 }, 'conservatory-ballroom': { row: 4, col: 1 }, 'ballroom': { row: 4, col: 2 }, 'ballroom-kitchen': { row: 4, col: 3 }, 'kitchen': { row: 4, col: 4 },
  // Add starting positions if needed, map to approximate grid cells or handle separately
};

// Calculate top/left percentages based on grid coords
const getPositionStyle = (position) => {
  const coords = positionToCoords[position];
  if (!coords) return { display: 'none' }; // Hide if position unknown

  const cellWidthPercent = 100 / 5;
  const cellHeightPercent = 100 / 5;

  const left = `${coords.col * cellWidthPercent}%`;
  const top = `${coords.row * cellHeightPercent}%`;

  // Center the token within the cell (adjust based on token size)
  // Assuming token width/height is roughly 10% of cell size for centering calc
  const transform = `translate(calc(${left} + ${cellWidthPercent/2}% - 10px), calc(${top} + ${cellHeightPercent/2}% - 10px))`; // Adjust 10px based on half token size

  // return { top, left };
  return { transform: `translate(${left}, ${top})`, width: `${cellWidthPercent}%`, height: `${cellHeightPercent}%` }; // Use transform for better performance? No, just use top/left for container
};

const GameBoard = ({ rooms, hallways, players, currentUserId, onRoomClick, currentTurn }) => {

  // <<< Log received props >>>
  console.log("GameBoard Render: Received players prop:", players);
  console.log("GameBoard Render: Current Turn:", currentTurn);

  // Get player by position
  const getPlayerInPosition = (position) => {
    const player = players.find(player => player.position === position);
    // <<< Log finding player >>>
    if (player) {
        // Only log if a player IS found for this position during render
        console.log(`GameBoard Render: Found ${player.username} at position ${position}`);
    }
    return player;
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

  // Render player token (will be positioned absolutely with offset for multiples)
  const renderPlayerToken = (player, indexInCell, totalInCell) => {
    if (!player || !positionToCoords[player.position]) return null; // Don't render if position unknown

    const isCurrentPlayer = player.userId === currentUserId;
    const isPlayerTurn = player.userId === currentTurn;
    const color = getCharacterColor(player.character);
    const textColor = ['#FFFFFF', '#E6C700'].includes(color) ? '#000000' : '#FFFFFF';

    // Calculate base absolute position style
    const coords = positionToCoords[player.position];

    // <<< Safeguard >>>
    if (!coords) {
        console.error(`GameBoard Error: Cannot find coordinates for position '${player.position}' for player ${player.username}. Hiding token.`);
        return null; // Don't render the token if coords are invalid
    }

    const cellWidthPercent = 100 / 5;
    const cellHeightPercent = 100 / 5;
    // Base position calculation (center of the cell)
    const baseLeft = `calc(${coords.col * cellWidthPercent}% + ${cellWidthPercent / 2}% - 11px)`;
    const baseTop = `calc(${coords.row * cellHeightPercent}% + ${cellHeightPercent / 2}% - 11px)`;

    // Calculate offset based on index within the cell
    let offsetLeft = 0;
    let offsetTop = 0;
    const offsetAmount = 5; // Pixels to offset

    if (totalInCell > 1) {
        // Simple offsetting: alternate left/right or use a small grid pattern
        // Example: Alternate left/right
        offsetLeft = (indexInCell % 2 === 0) ? -offsetAmount : offsetAmount;
        // Example: Could also do vertical offset based on pairs
        // offsetTop = Math.floor(indexInCell / 2) * offsetAmount;
    }

    // Apply offset using transform for potentially smoother animation
    const finalTransform = `translate(calc(${baseLeft} + ${offsetLeft}px), calc(${baseTop} + ${offsetTop}px))`;

    console.log(`GameBoard Render: Rendering ${player.username} at ${player.position} (Index: ${indexInCell}/${totalInCell}) -> Transform: ${finalTransform}`);

    return (
      <div
        key={player.userId} // Key for React list rendering
        className={`player-token ${isCurrentPlayer ? 'current-player' : ''} ${isPlayerTurn ? 'active-turn' : ''}`}
        // Apply transform instead of top/left directly
        style={{ backgroundColor: color, color: textColor, position: 'absolute', transform: finalTransform }}
        title={player.character}
      >
        {getCharacterDisplay(player.character)}
      </div>
    );
  };

  // Group players by their current position
  const playersByPosition = players.reduce((acc, player) => {
    const pos = player.position;
    if (positionToCoords[pos]) { // Only include players with valid board positions
        if (!acc[pos]) {
            acc[pos] = [];
        }
        acc[pos].push(player);
    }
    return acc;
  }, {});

  return (
    <div className="game-board">
      {/* Render the static grid structure */}
      <div className="board-grid">
        {/* Render all 25 grid cells (rooms, hallways, empty) without tokens initially */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => {
            const positionId = Object.keys(positionToCoords).find(
              key => positionToCoords[key].row === row && positionToCoords[key].col === col
            );
            const roomData = rooms.find(r => r.id === positionId);
            const hallwayData = hallways.find(h => h.id === positionId);
            const isEmpty = !roomData && !hallwayData && positionId;

            let cellType = 'empty';
            let name = '';
            let clickHandler = () => {};

            if (roomData) {
              cellType = 'room';
              name = roomData.name;
              clickHandler = () => handleSpaceClick(roomData.id);
            } else if (hallwayData) {
              cellType = 'hallway';
              // Determine orientation based on name convention (e.g., study-hall vs study-library)
              const parts = hallwayData.id.split('-');
              const pos1 = positionToCoords[parts[0]];
              const pos2 = positionToCoords[parts[1]];
              if (pos1 && pos2) {
                  cellType += (pos1.row === pos2.row) ? ' horizontal' : ' vertical';
              }
              clickHandler = () => handleSpaceClick(hallwayData.id);
            }

            // Key needs to be unique for each cell
            const cellKey = positionId || `empty-${row}-${col}`; 

            return (
              <div key={cellKey} className={`${cellType} board-cell`} onClick={clickHandler}>
                {name && <div className="room-name">{name}</div>}
                {/* Token is NOT rendered here anymore */}
              </div>
            );
          })
        )}
      </div>

      {/* Render player tokens absolutely positioned over the grid */}
      <div className="player-tokens-layer">
        {Object.keys(playersByPosition).map(position => {
            const playersInCell = playersByPosition[position];
            const totalInCell = playersInCell.length;
            return playersInCell.map((player, index) => 
                renderPlayerToken(player, index, totalInCell)
            );
        })}
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