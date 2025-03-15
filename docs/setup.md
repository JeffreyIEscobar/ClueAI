# Clue-Less Setup Guide

This document provides detailed instructions for setting up and running the Clue-Less game system.

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/JeffreyIEscobar/ClueAI.git
cd clue-less
```

### 2. Install Dependencies

#### Server Dependencies

```bash
cd server
npm install
cd ..
```

#### Client Dependencies

```bash
cd client
npm install
cd ..
```

#### Data Management Dependencies

```bash
cd data
npm install
cd ..
```

### 3. Configuration

Create configuration files for each subsystem:

#### Server Configuration

Create a `.env` file in the `server` directory with the following content:

```
PORT=3000
NODE_ENV=development
```

#### Client Configuration

Create a `.env` file in the `client` directory with the following content:

```
REACT_APP_API_URL=http://localhost:3000
```

## Running the Application

### 1. Start the Server

```bash
cd server
npm start
```

The server will start on port 3000 (or the port specified in your `.env` file).

### 2. Start the Client

In a new terminal window:

```bash
cd client
npm start
```

The client application will start and open in your default web browser.

## Development Workflow

### Running Tests

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test

# Run data management tests
cd data
npm test
```

### Building for Production

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```

## Troubleshooting

### Common Issues

1. **Port already in use**: If port 3000 is already in use, change the port in the server's `.env` file.

2. **Connection refused**: Ensure the server is running before starting the client.

3. **Module not found**: Run `npm install` in the respective directory to install missing dependencies.

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) 