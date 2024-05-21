// Importing required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Storing the game state
let gameState = {
  players: {},
  drawings: [],
  texts: []
};

// When a client connects
io.on('connection', (socket) => {
  console.log('User connected');

  // When a new player joins
  socket.on('new player', (playerName) => {
    gameState.players[socket.id] = playerName;
    io.emit('update game', gameState);
  });

  // When a player submits a drawing
  socket.on('submit drawing', (drawing) => {
    gameState.drawings.push(drawing);
    io.emit('update game', gameState);
  });

  // When a player submits a text
  socket.on('submit text', (text) => {
    gameState.texts.push(text);
    io.emit('update game', gameState);
  });

  // When a player disconnects
  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('update game', gameState);
    console.log('User disconnected');
  });
});

// Starting our server
server.listen(3000, () => {
  console.log('Server started on port 3000');
});
