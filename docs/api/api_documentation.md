# Clue-Less API Documentation

This document describes the API endpoints and WebSocket events used for communication between the client and server in the Clue-Less game system.

## REST API Endpoints

### Authentication

#### Register User

```
POST /api/auth/register
```

Request body:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "string"
}
```

#### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "success": true,
  "token": "string",
  "userId": "string",
  "username": "string"
}
```

### Game Management

#### Create Game

```
POST /api/games
```

Request body:
```json
{
  "name": "string",
  "maxPlayers": "number",
  "private": "boolean",
  "password": "string (optional)"
}
```

Response:
```json
{
  "success": true,
  "gameId": "string",
  "joinCode": "string"
}
```

#### List Games

```
GET /api/games
```

Response:
```json
{
  "games": [
    {
      "id": "string",
      "name": "string",
      "players": "number",
      "maxPlayers": "number",
      "status": "string",
      "private": "boolean"
    }
  ]
}
```

#### Join Game

```
POST /api/games/:gameId/join
```

Request body:
```json
{
  "password": "string (optional)"
}
```

Response:
```json
{
  "success": true,
  "gameId": "string",
  "initialState": "object"
}
```

#### Get Game State

```
GET /api/games/:gameId
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "players": [
    {
      "id": "string",
      "username": "string",
      "character": "string",
      "position": "string",
      "active": "boolean"
    }
  ],
  "currentTurn": "string",
  "board": "object"
}
```

## WebSocket Events

### Connection

To establish a WebSocket connection:

```javascript
const socket = new WebSocket('ws://localhost:3000/ws');
```

### Client-to-Server Events

#### Join Game

```json
{
  "type": "JOIN_GAME",
  "payload": {
    "gameId": "string",
    "token": "string"
  }
}
```

#### Move Character

```json
{
  "type": "MOVE",
  "payload": {
    "gameId": "string",
    "destination": "string"
  }
}
```

#### Make Suggestion

```json
{
  "type": "MAKE_SUGGESTION",
  "payload": {
    "gameId": "string",
    "character": "string",
    "weapon": "string"
  }
}
```

#### Disprove Suggestion

```json
{
  "type": "DISPROVE_SUGGESTION",
  "payload": {
    "gameId": "string",
    "card": "string"
  }
}
```

#### Make Accusation

```json
{
  "type": "MAKE_ACCUSATION",
  "payload": {
    "gameId": "string",
    "character": "string",
    "weapon": "string",
    "room": "string"
  }
}
```

#### End Turn

```json
{
  "type": "END_TURN",
  "payload": {
    "gameId": "string"
  }
}
```

### Server-to-Client Events

#### Game State Update

```json
{
  "type": "GAME_STATE",
  "payload": {
    "gameId": "string",
    "players": [
      {
        "id": "string",
        "username": "string",
        "character": "string",
        "position": "string",
        "active": "boolean"
      }
    ],
    "currentTurn": "string",
    "board": {
      "rooms": [],
      "hallways": [],
      "characters": {}
    }
  }
}
```

#### Turn Notification

```json
{
  "type": "TURN_NOTIFICATION",
  "payload": {
    "gameId": "string",
    "playerId": "string",
    "availableActions": ["MOVE", "SUGGEST", "ACCUSE", "END_TURN"]
  }
}
```

#### Suggestion Request

```json
{
  "type": "SUGGESTION_REQUEST",
  "payload": {
    "gameId": "string",
    "suggestingPlayer": "string",
    "character": "string",
    "weapon": "string",
    "room": "string",
    "matchingCards": ["string"]
  }
}
```

#### Suggestion Result

```json
{
  "type": "SUGGESTION_RESULT",
  "payload": {
    "gameId": "string",
    "suggestingPlayer": "string",
    "disprovingPlayer": "string",
    "cardRevealed": "string (only sent to suggesting player)",
    "wasDisproven": "boolean (sent to all players)"
  }
}
```

#### Accusation Result

```json
{
  "type": "ACCUSATION_RESULT",
  "payload": {
    "gameId": "string",
    "accusingPlayer": "string",
    "correct": "boolean",
    "gameOver": "boolean",
    "solution": {
      "character": "string",
      "weapon": "string",
      "room": "string"
    }
  }
}
```

#### Player Joined

```json
{
  "type": "PLAYER_JOINED",
  "payload": {
    "gameId": "string",
    "player": {
      "id": "string",
      "username": "string",
      "character": "string"
    }
  }
}
```

#### Player Left

```json
{
  "type": "PLAYER_LEFT",
  "payload": {
    "gameId": "string",
    "playerId": "string"
  }
}
```

#### Error

```json
{
  "type": "ERROR",
  "payload": {
    "code": "number",
    "message": "string"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 1000 | Invalid request format |
| 1001 | Authentication required |
| 1002 | Game not found |
| 1003 | Game already started |
| 1004 | Game full |
| 1005 | Not your turn |
| 1006 | Invalid move |
| 1007 | Invalid suggestion |
| 1008 | Invalid accusation |
| 1009 | Player not in game |
| 1010 | Action not allowed |

## Data Models

### Player

```json
{
  "id": "string",
  "username": "string",
  "character": "string",
  "position": "string",
  "active": "boolean",
  "cards": ["string"]
}
```

### Room

```json
{
  "id": "string",
  "name": "string",
  "adjacentHallways": ["string"],
  "secretPassage": "string (optional)"
}
```

### Hallway

```json
{
  "id": "string",
  "connectsRooms": ["string", "string"],
  "occupiedBy": "string (optional)"
}
```

### Card

```json
{
  "id": "string",
  "type": "CHARACTER | WEAPON | ROOM",
  "name": "string"
}
```

### Game

```json
{
  "id": "string",
  "name": "string",
  "status": "WAITING | PLAYING | COMPLETED",
  "players": ["Player"],
  "currentTurn": "string",
  "board": {
    "rooms": ["Room"],
    "hallways": ["Hallway"]
  },
  "solution": {
    "character": "string",
    "weapon": "string",
    "room": "string"
  }
}
``` 