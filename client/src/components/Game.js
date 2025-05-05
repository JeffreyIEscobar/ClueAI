import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import GameActions from './GameActions';
import GameLog from './GameLog';
import SuggestionModal from './SuggestionModal';
import AccusationModal from './AccusationModal';
import DisproveModal from './DisproveModal';
import '../styles/Game.css';

// Mock data for direct game play
const MOCK_USER = {
  id: 'user-1',
  username: 'Player1'
};

const MOCK_GAME_STATE = {
  gameId: 'game-1',
  status: 'in_progress',
  players: [
    { userId: 'user-1', username: 'Player1', character: 'Miss Scarlet', position: 'study', cards: ['Mrs. White', 'Kitchen', 'Revolver'] },
    { userId: 'user-2', username: 'Player2', character: 'Professor Plum', position: 'hall', cards: [] },
    { userId: 'user-3', username: 'Player3', character: 'Mrs. Peacock', position: 'lounge', cards: [] }
  ],
  board: {
    rooms: [
      { id: 'study', name: 'Study', x: 0, y: 0 },
      { id: 'hall', name: 'Hall', x: 1, y: 0 },
      { id: 'lounge', name: 'Lounge', x: 2, y: 0 },
      { id: 'library', name: 'Library', x: 0, y: 1 },
      { id: 'billiard', name: 'Billiard Room', x: 1, y: 1 },
      { id: 'dining', name: 'Dining Room', x: 2, y: 1 },
      { id: 'conservatory', name: 'Conservatory', x: 0, y: 2 },
      { id: 'ballroom', name: 'Ballroom', x: 1, y: 2 },
      { id: 'kitchen', name: 'Kitchen', x: 2, y: 2 }
    ],
    hallways: [
      { id: 'study-hall', from: 'study', to: 'hall' },
      { id: 'hall-lounge', from: 'hall', to: 'lounge' },
      { id: 'study-library', from: 'study', to: 'library' },
      { id: 'hall-billiard', from: 'hall', to: 'billiard' },
      { id: 'lounge-dining', from: 'lounge', to: 'dining' },
      { id: 'library-billiard', from: 'library', to: 'billiard' },
      { id: 'billiard-dining', from: 'billiard', to: 'dining' },
      { id: 'library-conservatory', from: 'library', to: 'conservatory' },
      { id: 'billiard-ballroom', from: 'billiard', to: 'ballroom' },
      { id: 'dining-kitchen', from: 'dining', to: 'kitchen' },
      { id: 'conservatory-ballroom', from: 'conservatory', to: 'ballroom' },
      { id: 'ballroom-kitchen', from: 'ballroom', to: 'kitchen' }
    ]
  },
  currentTurn: 'user-1',
  availableActions: {
    canMove: true,
    canSuggest: true,
    canAccuse: true,
    canEndTurn: true
  },
  suggestions: [],
  accusations: [],
  pendingSuggestion: null,
  solution: {
    character: 'Mr. Green',
    weapon: 'Rope',
    room: 'Library'
  }
};

const Game = () => {
  const [currentUser] = useState(MOCK_USER);
  const [gameState, setGameState] = useState(MOCK_GAME_STATE);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showAccusationModal, setShowAccusationModal] = useState(false);
  const [showDisproveModal, setShowDisproveModal] = useState(false);
  const [disproveData] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [error] = useState(null);
  const [aiTurnActive, setAiTurnActive] = useState(false);
  const [thinking, setThinking] = useState(false);
  
  // Use refs to avoid dependency cycles
  const performAiMoveRef = useRef();
  const performAiSuggestionRef = useRef();
  const performAiAccusationRef = useRef();
  const performAiEndTurnRef = useRef();
  const performAiTurnRef = useRef();

  // Define AI actions
  performAiMoveRef.current = (aiPlayer) => {
    // Get possible destinations
    const currentPosition = aiPlayer.position;
    const possibleDestinations = [];
    
    // Add adjacent rooms/hallways
    gameState.board.hallways.forEach(hallway => {
      if (hallway.from === currentPosition) {
        possibleDestinations.push(hallway.to);
      } else if (hallway.to === currentPosition) {
        possibleDestinations.push(hallway.from);
      }
    });
    
    // Add secret passages
    if (currentPosition === 'study') {
      possibleDestinations.push('kitchen');
    } else if (currentPosition === 'kitchen') {
      possibleDestinations.push('study');
    } else if (currentPosition === 'lounge') {
      possibleDestinations.push('conservatory');
    } else if (currentPosition === 'conservatory') {
      possibleDestinations.push('lounge');
    }
    
    // Choose random destination
    if (possibleDestinations.length > 0) {
      const randomDestination = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
      
      // Update the player position
      const updatedPlayers = gameState.players.map(player => {
        if (player.userId === aiPlayer.userId) {
          return { ...player, position: randomDestination };
        }
        return player;
      });
      
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers
      }));
      
      // Add to game log
      const newEntry = {
        type: 'movement',
        player: aiPlayer.username,
        content: `moved to ${randomDestination}`,
        timestamp: new Date()
      };
      
      setGameLog(prev => [newEntry, ...prev]);

      // End the turn after moving
      performAiEndTurnRef.current(aiPlayer);

    } else {
      // If no possible moves, end turn immediately
      performAiEndTurnRef.current(aiPlayer);
    }
  };
  
  performAiSuggestionRef.current = (aiPlayer) => {
    const characters = ['Colonel Mustard', 'Miss Scarlet', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock'];
    const weapons = ['Knife', 'Candlestick', 'Revolver', 'Rope', 'Lead Pipe', 'Wrench'];
    
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    const room = aiPlayer.position;
    
    // Only make suggestion if in a room (not hallway)
    if (gameState.board.rooms.some(r => r.id === room)) {
      const newSuggestion = {
        suggestingPlayer: aiPlayer.userId,
        character: randomCharacter,
        weapon: randomWeapon,
        room: room,
        timestamp: new Date()
      };
      
      setGameState(prev => ({
        ...prev,
        suggestions: [...(prev.suggestions || []), newSuggestion]
      }));
      
      // Update game log
      const newEntry = {
        type: 'suggestion',
        player: aiPlayer.username,
        content: `suggested ${randomCharacter} in the ${room} with the ${randomWeapon} (not disproven)`,
        timestamp: new Date()
      };
      
      setGameLog(prev => [newEntry, ...prev]);

      // AI suggestion doesn't involve real disprove logic in this mock
      // Directly end turn after suggesting
      performAiEndTurnRef.current(aiPlayer);
    } else {
      // Cannot suggest from hallway, end turn
      performAiEndTurnRef.current(aiPlayer);
    }
  };
  
  performAiAccusationRef.current = (aiPlayer) => {
    const characters = ['Colonel Mustard', 'Miss Scarlet', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock'];
    const weapons = ['Knife', 'Candlestick', 'Revolver', 'Rope', 'Lead Pipe', 'Wrench'];
    const rooms = ['Study', 'Hall', 'Lounge', 'Library', 'Billiard Room', 'Dining Room', 'Conservatory', 'Ballroom', 'Kitchen'];
    
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    
    // Check accusation against the mock solution
    const correct = 
      randomCharacter === gameState.solution.character &&
      randomWeapon === gameState.solution.weapon &&
      randomRoom === gameState.solution.room;
    
    const newAccusation = {
      accusingPlayer: aiPlayer.userId,
      character: randomCharacter,
      weapon: randomWeapon,
      room: randomRoom,
      correct: correct,
      timestamp: new Date()
    };
    
    setGameState(prev => ({
      ...prev,
      accusations: [...(prev.accusations || []), newAccusation]
    }));
    
    // Update game log
    const newEntry = {
      type: 'accusation',
      player: aiPlayer.username,
      content: `accused ${randomCharacter} in the ${randomRoom} with the ${randomWeapon} (${correct ? 'correct' : 'incorrect'})`,
      timestamp: new Date()
    };
    
    setGameLog(prev => [newEntry, ...prev]);
    
    if (correct) {
      setTimeout(() => {
        alert(`${aiPlayer.username}'s accusation was correct! They win the game!`);
      }, 500);
      // Potentially update game status to 'finished'
    } else {
      // Incorrect accusation doesn't end the game in this mock
      // but you might disable the player or show a message
      setGameLog(prev => [{
        type: 'info',
        player: aiPlayer.username,
        content: `made an incorrect accusation.`,
        timestamp: new Date()
      }, ...prev]);
    }

    // End turn regardless of accusation result
    performAiEndTurnRef.current(aiPlayer);
  };
  
  performAiEndTurnRef.current = (aiPlayer) => {
    // Add log entry for ending turn
    const endTurnEntry = {
      type: 'info',
      player: aiPlayer.username,
      content: `ended their turn.`,
      timestamp: new Date()
    };
    setGameLog(prev => [endTurnEntry, ...prev]);

    // Cycle to next player after a short delay for UI update
    setTimeout(() => {
      const playerIds = gameState.players.map(p => p.userId);
      const currentIndex = playerIds.indexOf(aiPlayer.userId); // Use aiPlayer.userId passed in
      const nextIndex = (currentIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextIndex];

      setGameState(prev => ({
        ...prev,
        currentTurn: nextPlayerId,
        // Reset available actions for the next player (mockup simplification)
        availableActions: {
          canMove: true,
          canSuggest: true,
          canAccuse: true,
          canEndTurn: true
        }
      }));
      setThinking(false); // Stop thinking visual
      setAiTurnActive(false); // Allow next AI turn trigger if applicable
    }, 500); // Short delay
  };

  // New function to handle the complete AI turn sequence
  performAiTurnRef.current = useCallback(() => {
    if (aiTurnActive) return; // Prevent overlapping calls

    const aiPlayer = gameState.players.find(p => p.userId === gameState.currentTurn);
    if (!aiPlayer || aiPlayer.userId === currentUser.id) {
      setAiTurnActive(false); // Should not happen, but safety check
      return;
    }

    setAiTurnActive(true);
    setThinking(true); // Show thinking state

    const thinkingEntry = {
      type: 'info',
      player: aiPlayer.username,
      content: `is thinking...`,
      timestamp: new Date()
    };
    setGameLog(prev => [thinkingEntry, ...prev]);


    // Simulate thinking delay
    const thinkingTime = Math.random() * 5000 + 10000; // 10s to 15s delay
    setTimeout(() => {
       // Decide action
       // --- REMOVE RANDOM ACTION LOGIC ---
       // const actionRoll = Math.random();
       // const canSuggest = gameState.board.rooms.some(r => r.id === aiPlayer.position);
       //
       // if (actionRoll < 0.6) { // Try Move
       //   performAiMoveRef.current(aiPlayer);
       // } else if (actionRoll < 0.8 && canSuggest) { // Try Suggest (only if in room)
       //   performAiSuggestionRef.current(aiPlayer);
       // } else if (actionRoll < 0.9) { // Try Accuse
       //   performAiAccusationRef.current(aiPlayer);
       // } else { // End Turn immediately
       //   performAiEndTurnRef.current(aiPlayer);
       // }

       // --- ALWAYS TRY TO MOVE --- 
       // The performAiMoveRef function will handle ending the turn if no move is possible.
       performAiMoveRef.current(aiPlayer);

    }, thinkingTime);

  // Rerun when currentTurn changes, but only if it's an AI's turn
  // }, [aiTurnActive, currentUser.id, gameState.currentTurn, gameState.players, gameState.board.rooms]);
  // Simplified dependencies as board.rooms is not directly used here anymore for decision
  }, [aiTurnActive, currentUser.id, gameState.currentTurn, gameState.players]);


  // Effect to trigger AI turn
  useEffect(() => {
    const currentPlayerIsAI = gameState.currentTurn !== currentUser.id;
    // Ensure gameState is loaded and it's an AI's turn and no AI turn is already running
    if (gameState && gameState.players.length > 0 && currentPlayerIsAI && !aiTurnActive && performAiTurnRef.current) {
       performAiTurnRef.current();
    }
  }, [gameState, currentUser.id, aiTurnActive]);

  useEffect(() => {
    // Initialize the game log with a welcome message
    setGameLog([
      {
        type: 'info',
        player: 'Game',
        content: 'Welcome to Clue-Less! Your turn to play.',
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleMove = (destination) => {
    // Local mock implementation
    console.log('Moving to:', destination);
    
    // Check if move is valid - only allow moves to adjacent rooms or hallways
    const currentPosition = gameState.players.find(p => p.userId === currentUser.id)?.position;
    const isAdjacent = gameState.board.hallways.some(
      h => (h.from === currentPosition && h.to === destination) || 
           (h.to === currentPosition && h.from === destination)
    );
    
    if (!isAdjacent && currentPosition !== destination) {
      // Special case for secret passages
      const isSecretPassage = 
        (currentPosition === 'study' && destination === 'kitchen') ||
        (currentPosition === 'kitchen' && destination === 'study') ||
        (currentPosition === 'lounge' && destination === 'conservatory') ||
        (currentPosition === 'conservatory' && destination === 'lounge');
        
      if (!isSecretPassage) {
        alert("Invalid move! You can only move to adjacent rooms or through secret passages.");
        return;
      }
    }
    
    // Update the player position locally
    const updatedPlayers = gameState.players.map(player => {
      if (player.userId === currentUser.id) {
        return { ...player, position: destination };
      }
      return player;
    });
    
    setGameState(prev => ({
      ...prev,
      players: updatedPlayers
    }));
    
    // Add to game log using functional update
    const newEntry = {
      type: 'movement',
      player: currentUser.username,
      content: `moved to ${destination}`,
      timestamp: new Date()
    };
    
    setGameLog(prev => [newEntry, ...prev]); // Use functional update
    // Player turn doesn't end automatically after move in Clue
  };

  const handleSuggest = (suggestion) => {
    // Local mock implementation
    console.log('Making suggestion:', suggestion);
    const newSuggestion = {
      suggestingPlayer: currentUser.id,
      character: suggestion.character,
      weapon: suggestion.weapon,
      room: suggestion.room,
      timestamp: new Date()
    };
    
    setGameState(prev => ({
      ...prev,
      suggestions: [...(prev.suggestions || []), newSuggestion]
    }));
    
    // Update game log using functional update
    const newEntry = {
      type: 'suggestion',
      player: currentUser.username,
      content: `suggested ${suggestion.character} in the ${suggestion.room} with the ${suggestion.weapon} (not disproven)`,
      timestamp: new Date()
    };
    
    setGameLog(prev => [newEntry, ...prev]); // Use functional update
    setShowSuggestionModal(false);
    // Player turn doesn't end automatically after suggestion
  };

  const handleAccuse = (accusation) => {
    console.log('Making accusation:', accusation);
    
    // Check accusation against the mock solution
    const correct = 
      accusation.character === gameState.solution.character &&
      accusation.weapon === gameState.solution.weapon &&
      accusation.room === gameState.solution.room;
      
    const newAccusation = {
      accusingPlayer: currentUser.id,
      character: accusation.character,
      weapon: accusation.weapon,
      room: accusation.room,
      correct: correct,
      timestamp: new Date()
    };
    
    setGameState(prev => ({
      ...prev,
      accusations: [...(prev.accusations || []), newAccusation]
    }));
    
    // Update game log using functional update
    const newEntry = {
      type: 'accusation',
      player: currentUser.username,
      content: `accused ${accusation.character} in the ${accusation.room} with the ${accusation.weapon} (${correct ? 'correct' : 'incorrect'})`,
      timestamp: new Date()
    };
    
    setGameLog(prev => [newEntry, ...prev]); // Use functional update
    
    if (correct) {
      setTimeout(() => {
        alert('Your accusation was correct! You win the game!');
      }, 500);
      // Potentially update game status to 'finished'
    } else {
      setTimeout(() => {
        alert('Your accusation was incorrect!');
        // In a real game, the player might be disqualified or lose their turn
      }, 500);
    }
    setShowAccusationModal(false);
    // An incorrect accusation usually ends the player's ability to play,
    // but doesn't necessarily end their *current* turn immediately.
    // A correct accusation ends the game.
    // Let's explicitly NOT end the turn here, the player must click End Turn.
  };

  const handleEndTurn = () => {
    // Add log entry
    const player = gameState.players.find(p => p.userId === currentUser.id);
    const endTurnEntry = {
      type: 'info',
      player: player?.username || 'Current Player',
      content: `ended their turn.`,
      timestamp: new Date()
    };
    setGameLog(prev => [endTurnEntry, ...prev]);

    // Cycle to next player
    const playerIds = gameState.players.map(p => p.userId);
    const currentIndex = playerIds.indexOf(currentUser.id);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];

    setGameState(prev => ({
      ...prev,
      currentTurn: nextPlayerId,
      // Reset available actions for the next player (mockup simplification)
      availableActions: {
        canMove: true,
        canSuggest: true,
        canAccuse: true,
        canEndTurn: true
      }
    }));
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  const isCurrentTurn = gameState.currentTurn === currentUser?.id;
  const availableActions = gameState.availableActions || {};

  // Get current player data
  const currentPlayer = gameState.players.find(player => player.userId === gameState.currentTurn);
  const currentTurnUsername = currentPlayer?.username || 'Unknown';
  const isMyTurn = gameState.currentTurn === currentUser.id;

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Clue-Less Game</h1>
        <span className="current-turn-indicator">
           Turn: {currentTurnUsername} {thinking && !isMyTurn ? '(Thinking...)' : ''}
         </span>
      </header>

      <div className="game-content">
        <aside className="game-sidebar">
          <PlayerInfo 
            players={gameState.players} 
            currentTurn={gameState.currentTurn} 
            currentUserId={currentUser?.id}
          />
          <GameLog log={gameLog} />
        </aside>

        <main className="game-main">
          <GameBoard 
            rooms={gameState.board.rooms}
            hallways={gameState.board.hallways}
            players={gameState.players}
            currentUserId={currentUser?.id}
            currentTurn={gameState.currentTurn}
            onRoomClick={handleMove}
          />
          
          <GameActions
            isCurrentTurn={isCurrentTurn}
            availableActions={availableActions}
            onMove={availableActions.canMove ? handleMove : null}
            onSuggest={availableActions.canSuggest ? () => setShowSuggestionModal(true) : null}
            onAccuse={() => setShowAccusationModal(true)}
            onEndTurn={availableActions.canEndTurn ? handleEndTurn : null}
            playerCards={gameState.players.find(p => p.userId === currentUser?.id)?.cards || []}
          />
        </main>
      </div>

      {/* Modals */}
      {showSuggestionModal && (
        <SuggestionModal 
          onClose={() => setShowSuggestionModal(false)} 
          onSubmit={handleSuggest}
          currentRoom={gameState.players.find(p => p.userId === currentUser?.id)?.position}
        />
      )}
      
      {showAccusationModal && (
        <AccusationModal 
          onClose={() => setShowAccusationModal(false)} 
          onSubmit={handleAccuse}
        />
      )}
      
      {showDisproveModal && disproveData && (
        <DisproveModal
          suggestion={disproveData.suggestion}
          disprovingPlayer={disproveData.disprovingPlayer}
          possibleCards={disproveData.possibleCards}
          onDisprove={(card) => { /* Mock: handleDisprove(card) */ setShowDisproveModal(false); }}
          onClose={() => setShowDisproveModal(false)}
        />
      )}
    </div>
  );
};

export default Game; 