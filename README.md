# Clue-Less Game System

## Overview
Clue-Less is a simplified online adaptation of the classic board game Clue®. This project implements a client-server architecture that allows multiple players to join and play the game remotely through a web interface.

## Game Rules
The game is a simplified version of the popular board game, Clue®. The main simplification is in the navigation of the game board.

### Board Layout
- Rooms are laid out in a 3x3 grid with hallways separating each pair of adjacent rooms
- Each hallway only holds one character at a time
- Some corner rooms have secret passages that allow direct movement to the diagonally opposite room

### Movement Rules
- If you are in a room, you may:
  - Move through one of the doors to a hallway (if it's not blocked)
  - Take a secret passage to a diagonally opposite room (if there is one) and make a suggestion
  - Stay in the room if you were moved there by another player's suggestion, and make a suggestion
- If you are in a hallway, you must move to one of the two rooms accessible from that hallway and make a suggestion
- Your first move must be to the hallway that is adjacent to your home square

### Suggestions and Accusations
- When making a suggestion, you specify a character and a weapon (the room is the one you're currently in)
- The suggested character is moved to your room
- Other players try to disprove your suggestion by showing you a card that matches your suggestion
- You may make an accusation at any time during your turn
- If your accusation is correct, you win the game. If incorrect, you remain in the game but can no longer make suggestions or accusations

## Architecture
The system is divided into three main subsystems:
- **Client Subsystem**: Handles user interface and player interactions
- **Server Subsystem**: Manages game logic, rules enforcement, and state management
- **Data Management Subsystem**: Handles data persistence and retrieval

## Technologies Used
- **Frontend**: React, React Router, Socket.io Client, Styled Components
- **Backend**: Node.js, Express, Socket.io, MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure
```
clue-less/
├── client/             # Client subsystem
│   ├── public/         # Static assets
│   ├── src/            # Client source code
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts
│   │   ├── styles/     # CSS files
│   │   └── utils/      # Utility functions
├── server/             # Server subsystem
│   ├── src/            # Server source code
│   │   ├── controllers/  # Request handlers
│   │   ├── models/     # Data models
│   │   ├── services/   # Business logic
│   │   └── utils/      # Utility functions
```

## Development
This project follows an incremental development approach:
1. **Skeletal System**: Architecture validation
2. **Minimal System**: Core functionality with basic interface
3. **Target System**: Complete game with full graphical interface

## Minimal System Implementation
This release represents the Minimal System implementation with the following features:
- Complete game board visualization with rooms, hallways, and player tokens
- Turn-based gameplay with automated AI players
- Game action controls (Move, Suggest, Accuse, End Turn)
- Game log displaying all player actions
- Player information panel showing all players and their status
- Suggestion and accusation workflow implementation
- Responsive design that works on various screen sizes

### How to Run
1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
3. Start the game:
   ```
   npm start
   ```
4. Access the game at http://localhost:3000

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Original game concept by Anthony E. Pratt
- Project based on requirements from a software engineering course
