const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let turnQueue = [];
let textHistory = [];

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  turnQueue.push(socket.id);
  
  // Send initial state to the new client
  socket.emit('gameState', { textHistory, currentTurn: turnQueue[0] });

  // Notify all clients of the new player and updated turn queue
  io.emit('updateTurnQueue', turnQueue);

  socket.on('submitText', (text) => {
    if (turnQueue[0] === socket.id) {
      // Add the text to the history
      textHistory.push({ id: socket.id, text });
      // Rotate the turn queue
      turnQueue.push(turnQueue.shift());
      // Broadcast the updated text history and new turn
      io.emit('newText', { textHistory, currentTurn: turnQueue[0] });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
    turnQueue = turnQueue.filter(id => id !== socket.id);
    io.emit('updateTurnQueue', turnQueue);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
