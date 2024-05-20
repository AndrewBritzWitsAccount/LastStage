const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = [];
let currentPlayerIndex = 0;

io.on('connection', socket => {
    console.log('A user connected');
    players.push(socket.id);

    io.emit('turn', players[currentPlayerIndex]);

    socket.on('message', message => {
        io.emit('message', { player: socket.id, text: message });

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        io.emit('turn', players[currentPlayerIndex]);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        players = players.filter(playerId => playerId !== socket.id);

        if (socket.id === players[currentPlayerIndex]) {
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            io.emit('turn', players[currentPlayerIndex]);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
