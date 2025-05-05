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
  username: 'Jeff'
};

const MOCK_GAME_STATE = {
  gameId: 'game-1',
  status: 'in_progress',
  players: [
    { userId: 'user-1', username: 'Jeff', character: 'Miss Scarlet', position: 'study', cards: ['Mrs. White', 'Kitchen', 'Revolver'], status: 'active', turnCount: 0 },
    { userId: 'user-2', username: 'Hayden', character: 'Professor Plum', position: 'hall', cards: [], status: 'active', turnCount: 0 },
    { userId: 'user-3', username: 'Nadiia', character: 'Mrs. Peacock', position: 'lounge', cards: [], status: 'active', turnCount: 0 }
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
    
    // Filter out the current position to ensure the AI actually moves
    const validDestinations = possibleDestinations.filter(dest => dest !== currentPosition);

    // Choose random destination from valid ones
    if (validDestinations.length > 0) {
      const randomDestination = validDestinations[Math.floor(Math.random() * validDestinations.length)];
      
      // console.log(`AI Action: ${aiPlayer.username} attempting move from ${currentPosition} to ${randomDestination}`);
      console.log(`Connected User: ${aiPlayer.username} attempting move from ${currentPosition} to ${randomDestination}`);

      // Update the player position
      setGameState(prevState => {
          const updatedPlayers = prevState.players.map(player => {
              if (player.userId === aiPlayer.userId) {
                  return { ...player, position: randomDestination };
              }
              return player;
          });
          const newState = {
              ...prevState,
              players: updatedPlayers
          };
          // console.log(`AI Action: ${aiPlayer.username} state AFTER move update:`, newState.players.find(p => p.userId === aiPlayer.userId));
          console.log(`Connected User: ${aiPlayer.username} state AFTER move update:`, newState.players.find(p => p.userId === aiPlayer.userId));
          return newState;
      });
      
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
      
      setGameState(prevState => ({
        ...prevState,
        suggestions: [...(prevState.suggestions || []), newSuggestion]
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
    
    setGameState(prevState => ({
      ...prevState,
      accusations: [...(prevState.accusations || []), newAccusation]
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
      // Incorrect accusation: Player is out
      setGameState(prevState => {
        const updatedPlayers = prevState.players.map(p =>
          p.userId === aiPlayer.userId ? { ...p, status: 'inactive' } : p
        );
        return { ...prevState, players: updatedPlayers };
      });

      setGameLog(prev => [{
        type: 'info',
        player: aiPlayer.username,
        content: `made an incorrect accusation and is out of the game!`,
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

    // Cycle to next ACTIVE player after a short delay for UI update
    setTimeout(() => {
      const playerIds = gameState.players.map(p => p.userId);
      const currentIndex = playerIds.indexOf(aiPlayer.userId);
      let nextIndex = (currentIndex + 1) % playerIds.length;
      let nextPlayer = gameState.players[nextIndex];

      // Find the next active player
      while (nextPlayer.status === 'inactive') {
          if (nextIndex === currentIndex) { // All players inactive? Should not happen in normal play
              console.error("Error: Could not find next active player.");
              setGameState(prev => ({ ...prev, status: 'finished' })); // End game?
              return;
          }
          nextIndex = (nextIndex + 1) % playerIds.length;
          nextPlayer = gameState.players[nextIndex];
      }
      const nextPlayerId = playerIds[nextIndex];

      const currentPlayers = gameState.players;
      const finishedPlayerIndex = currentPlayers.findIndex(p => p.userId === aiPlayer.userId);
      let updatedPlayers = [...currentPlayers]; // Create a mutable copy
      if (finishedPlayerIndex !== -1) {
          // Increment turn count first
          updatedPlayers[finishedPlayerIndex] = {
              ...updatedPlayers[finishedPlayerIndex],
              turnCount: updatedPlayers[finishedPlayerIndex].turnCount + 1
          };
      } // End of if (finishedPlayerIndex !== -1)

      console.log("DIAGNOSTIC: Final updatedPlayers before setting state in endTurn:", updatedPlayers);

      setGameState(prevState => ({
        ...prevState,
        players: updatedPlayers, // Use the potentially modified array
        currentTurn: nextPlayerId,
        availableActions: { canMove: true, canSuggest: true, canAccuse: true, canEndTurn: true }
      }));
      setThinking(false);
      setAiTurnActive(false);
    }, 500);
  };

  // New function to handle the complete AI turn sequence
  performAiTurnRef.current = useCallback(() => {
    if (aiTurnActive) return; // Prevent overlapping calls

    const aiPlayer = gameState.players.find(p => p.userId === gameState.currentTurn);
    // console.log(`Connected User: performAiTurn triggered for ${aiPlayer?.username} (ID: ${aiPlayer?.userId})`);
    console.log(`performedTurn: triggered for ${aiPlayer?.username} (ID: ${aiPlayer?.userId})`);

    if (!aiPlayer || aiPlayer.userId === currentUser.id) {
      // console.log(`AI Action: performAiTurn exiting - not AI turn or player not found.`);
      console.log(`Connected User: performAiTurn exiting - not AI turn or player not found.`);
      setAiTurnActive(false); // Should not happen, but safety check
      return;
    }

    // Check if player is inactive
    if (aiPlayer.status === 'inactive') {
        setGameLog(prev => [{
            type: 'info',
            player: aiPlayer.username,
            content: `is out of the game, skipping turn.`,
            timestamp: new Date()
        }, ...prev]);
        performAiEndTurnRef.current(aiPlayer); // Skip turn
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
    const thinkingTime = 8000; // Fixed 8 seconds delay
    setTimeout(() => {
       // Decide action - Prioritize Move > Suggest > Accuse (after turn 1)
       const currentPosition = aiPlayer.position;
       const possibleDestinations = [];
       gameState.board.hallways.forEach(hallway => {
         if (hallway.from === currentPosition) possibleDestinations.push(hallway.to);
         else if (hallway.to === currentPosition) possibleDestinations.push(hallway.from);
       });
       if (currentPosition === 'study') possibleDestinations.push('kitchen');
       else if (currentPosition === 'kitchen') possibleDestinations.push('study');
       else if (currentPosition === 'lounge') possibleDestinations.push('conservatory');
       else if (currentPosition === 'conservatory') possibleDestinations.push('lounge');
       const validDestinations = possibleDestinations.filter(dest => dest !== currentPosition);

       const canMove = validDestinations.length > 0;
       const canSuggest = gameState.board.rooms.some(r => r.id === aiPlayer.position);
       const accuseRoll = Math.random(); // Roll for accusation chance

       if (canMove) {
         // console.log(`AI Action: ${aiPlayer.username} decided to MOVE.`);
         console.log(`Connected User: ${aiPlayer.username} decided to MOVE.`);
         performAiMoveRef.current(aiPlayer);
       } else if (canSuggest) {
         // console.log(`AI Action: ${aiPlayer.username} decided to SUGGEST.`);
         console.log(`Connected User: ${aiPlayer.username} decided to SUGGEST.`);
         performAiSuggestionRef.current(aiPlayer);
       } else if (aiPlayer.turnCount > 0 && accuseRoll < 0.2) { // 20% chance to accuse after turn 1
         // console.log(`AI Action: ${aiPlayer.username} decided to ACCUSE.`);
         console.log(`Connected User: ${aiPlayer.username} decided to ACCUSE.`);
         performAiAccusationRef.current(aiPlayer);
       } else {
         // console.log(`AI Action: ${aiPlayer.username} decided to END TURN (no other actions possible/chosen).`);
         console.log(`Connected User: ${aiPlayer.username} decided to END TURN (no other actions possible/chosen).`);
         // Cannot move, cannot suggest, and not accusing - End Turn
         performAiEndTurnRef.current(aiPlayer);
       }

    }, thinkingTime);

  // Rerun when currentTurn changes, but only if it's an AI's turn
  // Dependencies updated to include board info needed for decisions
  }, [aiTurnActive, currentUser.id, gameState]); // Use gameState dependency


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
    setGameState(prevState => {
        const updatedPlayers = prevState.players.map(player => {
            if (player.userId === currentUser.id) {
                return { ...player, position: destination };
            }
            return player;
        });
        return { ...prevState, players: updatedPlayers };
    });
    
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
    
    setGameState(prevState => ({
      ...prevState,
      suggestions: [...(prevState.suggestions || []), newSuggestion]
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
    
    setGameState(prevState => ({
      ...prevState,
      accusations: [...(prevState.accusations || []), newAccusation]
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

    // Increment turn count for the human player as well
    const updatedPlayers = gameState.players.map(p =>
        p.userId === currentUser.id ? { ...p, turnCount: p.turnCount + 1 } : p
    );

    setGameState(prevState => ({
      ...prevState,
      players: updatedPlayers, // Update players state
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
            key={gameState.currentTurn}
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