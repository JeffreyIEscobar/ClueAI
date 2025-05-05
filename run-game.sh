#!/bin/bash

# Kill any process using port 5000
echo "Checking for processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No process found on port 5000"
 
# Start the client only (since we've made it work without a backend)
echo "Starting the Clue-Less game..."
cd client && npm start 