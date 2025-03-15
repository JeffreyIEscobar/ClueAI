# Clue-Less Game System

## Overview
Clue-Less is a simplified online adaptation of the classic board game Clue®. This project implements a client-server architecture that allows multiple players to join and play the game remotely through a web interface.

## Architecture
The system is divided into three main subsystems:
- **Client Subsystem**: Handles user interface and player interactions
- **Server Subsystem**: Manages game logic, rules enforcement, and state management
- **Data Management Subsystem**: Handles data persistence and retrieval

## Project Structure
```
clue-less/
├── client/             # Client subsystem
│   ├── public/         # Static assets
│   ├── src/            # Client source code
│   └── tests/          # Client tests
├── server/             # Server subsystem
│   ├── src/            # Server source code
│   │   ├── controllers/  # Request handlers
│   │   ├── models/     # Data models
│   │   ├── services/   # Business logic
│   │   └── utils/      # Utility functions
│   └── tests/          # Server tests
├── data/               # Data management subsystem
│   ├── src/            # Data layer source code
│   └── tests/          # Data layer tests
├── common/             # Shared code between subsystems
│   ├── src/            # Shared source code
│   │   ├── constants/  # Game constants
│   │   ├── models/     # Shared data models
│   │   └── utils/      # Shared utilities
│   └── tests/          # Tests for shared code
├── docs/               # Documentation
│   ├── architecture/   # Architecture diagrams
│   ├── requirements/   # Requirements documentation
│   └── api/            # API documentation
└── scripts/            # Build and deployment scripts
```

## Skeletal System
The current implementation represents the skeletal system increment, which validates the architecture and establishes the framework for future development. It includes:

- Basic subsystem definitions
- Message interfaces between subsystems
- Minimal application logic for demonstration purposes
- Stubs and drivers for testing

## Getting Started
1. Clone the repository
2. Install dependencies for each subsystem
3. Start the server
4. Launch the client application

Detailed setup instructions are available in the [docs/setup.md](docs/setup.md) file.

## Development
This project follows an incremental development approach:
1. **Skeletal System**: Architecture validation (current phase)
2. **Minimal System**: Core functionality with text-based interface
3. **Target System**: Complete game with graphical interface

## License
See the [LICENSE](LICENSE) file for details.
