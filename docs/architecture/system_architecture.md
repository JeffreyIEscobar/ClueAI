# Clue-Less System Architecture

## Overview

The Clue-Less game system is designed using a modular, three-tier architecture that separates concerns between client presentation, server-side game logic, and data management. This document outlines the high-level architecture, component interactions, and message interfaces between subsystems.

## Architectural Principles

- **Separation of Concerns**: Each subsystem has a distinct responsibility
- **Loose Coupling**: Subsystems communicate through well-defined interfaces
- **Single Source of Truth**: The server maintains the authoritative game state
- **Real-time Communication**: Updates are propagated to all clients immediately
- **Stateless Communication**: Each request contains all necessary information

## Subsystems

### 1. Client Subsystem

The Client subsystem is responsible for:
- Rendering the game board and UI elements
- Capturing user inputs and actions
- Communicating with the server
- Displaying real-time updates

#### Key Components:
- **UI Renderer**: Manages the visual representation of the game
- **Input Handler**: Captures and validates user actions
- **Communication Manager**: Handles client-server communication
- **State Manager**: Maintains local representation of game state

### 2. Server Subsystem

The Server subsystem is responsible for:
- Enforcing game rules and logic
- Processing player actions
- Managing game state
- Coordinating communication between players
- Validating moves, suggestions, and accusations

#### Key Components:
- **Game Controller**: Orchestrates game flow and processes player actions
- **Rule Engine**: Enforces game rules and validates player actions
- **State Manager**: Maintains the authoritative game state
- **Communication Hub**: Manages real-time updates to clients
- **Session Manager**: Handles player connections and disconnections

### 3. Data Management Subsystem

The Data Management subsystem is responsible for:
- Persisting game state
- Managing player profiles and statistics
- Providing data access interfaces
- Ensuring data integrity

#### Key Components:
- **Data Access Layer**: Provides interfaces for data operations
- **Storage Manager**: Handles data persistence and retrieval
- **Cache Manager**: Optimizes data access performance
- **Data Validator**: Ensures data integrity

## Communication Interfaces

### Client-to-Server Messages

| Message Type | Description | Payload |
|--------------|-------------|---------|
| JOIN_GAME | Request to join a game | `{ playerId, gameId? }` |
| CREATE_GAME | Request to create a new game | `{ playerId, gameSettings }` |
| MOVE | Player movement action | `{ playerId, destination }` |
| MAKE_SUGGESTION | Player suggestion action | `{ playerId, character, weapon, room }` |
| MAKE_ACCUSATION | Player accusation action | `{ playerId, character, weapon, room }` |
| DISPROVE_SUGGESTION | Response to a suggestion | `{ playerId, cardRevealed }` |
| END_TURN | Signal end of player's turn | `{ playerId }` |
| DISCONNECT | Player disconnection notification | `{ playerId }` |

### Server-to-Client Messages

| Message Type | Description | Payload |
|--------------|-------------|---------|
| GAME_STATE | Current game state update | `{ gameState, players, board }` |
| TURN_NOTIFICATION | Notification of turn change | `{ activePlayerId, availableActions }` |
| SUGGESTION_REQUEST | Request to disprove a suggestion | `{ suggestingPlayerId, character, weapon, room, matchingCards }` |
| SUGGESTION_RESULT | Result of a suggestion | `{ suggestingPlayerId, disprovingPlayerId?, cardRevealed? }` |
| ACCUSATION_RESULT | Result of an accusation | `{ accusingPlayerId, correct, gameOver, solution? }` |
| PLAYER_JOINED | Notification of new player | `{ playerId, playerName }` |
| PLAYER_LEFT | Notification of player departure | `{ playerId }` |
| ERROR | Error notification | `{ code, message }` |

### Server-to-Data Messages

| Message Type | Description | Payload |
|--------------|-------------|---------|
| SAVE_GAME_STATE | Request to save game state | `{ gameId, gameState }` |
| LOAD_GAME_STATE | Request to load game state | `{ gameId }` |
| SAVE_PLAYER_STATS | Request to update player statistics | `{ playerId, stats }` |
| LOAD_PLAYER_STATS | Request to load player statistics | `{ playerId }` |

### Data-to-Server Messages

| Message Type | Description | Payload |
|--------------|-------------|---------|
| GAME_STATE_SAVED | Confirmation of saved game state | `{ gameId, success }` |
| GAME_STATE_LOADED | Response with loaded game state | `{ gameId, gameState }` |
| PLAYER_STATS_SAVED | Confirmation of saved player statistics | `{ playerId, success }` |
| PLAYER_STATS_LOADED | Response with loaded player statistics | `{ playerId, stats }` |

## Data Flow

1. **Game Initialization**:
   - Client sends CREATE_GAME or JOIN_GAME
   - Server validates request
   - Server initializes or updates game state
   - Server broadcasts PLAYER_JOINED to all clients
   - Server sends GAME_STATE to all clients

2. **Player Turn**:
   - Server sends TURN_NOTIFICATION to active player
   - Client sends action (MOVE, MAKE_SUGGESTION, MAKE_ACCUSATION)
   - Server validates action
   - Server updates game state
   - Server broadcasts updated GAME_STATE to all clients

3. **Suggestion Process**:
   - Client sends MAKE_SUGGESTION
   - Server identifies players who can disprove
   - Server sends SUGGESTION_REQUEST to relevant player
   - Client responds with DISPROVE_SUGGESTION
   - Server sends SUGGESTION_RESULT to suggesting player
   - Server broadcasts updated GAME_STATE to all clients

4. **Accusation Process**:
   - Client sends MAKE_ACCUSATION
   - Server validates accusation against solution
   - Server sends ACCUSATION_RESULT to all clients
   - If correct, server ends game and broadcasts final GAME_STATE
   - If incorrect, server updates player status and continues game

## Deployment Architecture

The Clue-Less system is designed to be deployed as:

- **Client**: Static web assets served from a CDN or web server
- **Server**: Node.js application running on a cloud platform
- **Data Management**: Database service (SQL or NoSQL) with appropriate scaling

## Security Considerations

- All client-server communication occurs over secure WebSocket connections (WSS)
- Player authentication is required before joining games
- Server validates all client actions to prevent cheating
- Sensitive game data (solution cards) is never sent to clients

## Performance Considerations

- WebSockets provide low-latency real-time updates
- Server optimizes broadcasts to minimize network traffic
- Data caching reduces database load
- Client-side prediction improves perceived responsiveness 