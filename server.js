const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve game.html as the default file for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

let players = [];
let currentPlayerIndex = 0;
let gameData = [];
let isDrawingTurn = false; // Track if the current turn is for drawing or writing

io.on('connection', socket => {
    console.log('A user connected');
    players.push(socket.id);

    if (players.length === 1) {
        // First player sends a sentence
        io.emit('turn', { playerId: players[currentPlayerIndex], turnType: 'sentence' });
    } else if (players.length > 1) {
        // Notify all players of new connection, but not the first player
        io.emit('turn', { playerId: players[currentPlayerIndex], turnType: isDrawingTurn ? 'drawing' : 'sentence' });
    }

    socket.on('sentence', sentence => {
        gameData.push({ type: 'sentence', content: sentence });
        isDrawingTurn = true;
        io.emit('endTurn', players[currentPlayerIndex]); // Signal end of turn
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        io.emit('turn', { playerId: players[currentPlayerIndex], turnType: 'drawing', previousData: sentence });
    });

    socket.on('image', imageData => {
        gameData.push({ type: 'image', content: imageData });
        isDrawingTurn = false;
        io.emit('endTurn', players[currentPlayerIndex]); // Signal end of turn
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        io.emit('turn', { playerId: players[currentPlayerIndex], turnType: 'sentence', previousData: imageData });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        players = players.filter(playerId => playerId !== socket.id);
        if (players.length === 0) {
            // Reset game state if all players disconnect
            gameData = [];
            currentPlayerIndex = 0;
            isDrawingTurn = false;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
