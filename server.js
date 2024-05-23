const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./db');
const app = express();
const bycrypt = require('bcryptjs');
const server = http.createServer(app);
const fs = require('fs');

const io = socketIo(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

let players = [];
let currentPlayerIndex = 0;
let gameData = [];
let isDrawingTurn = false; // Track if the current turn is for drawing or writing
let totalTurns = 0;
const maxRounds = 1; // Set the maximum number of rounds here

// Middleware to parse JSON bodies
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve game.html as the default file for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/', 'register.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/', 'login.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/', 'game.html'));
});

app.get('/lobby', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/', 'lobby.html'));
});

app.post('/login', async (req, res) => {
  // Handle user login
  const { username, password } = req.body;
  const user = await db.getUser(username);
  let loginMessage = 'Login successful';
  if (user) {
    const isPasswordCorrect = bycrypt.compareSync(password, user.password);
    if (isPasswordCorrect) {
      if (players.length === 0) {
        db.logInUser(user.id, true);
        loginMessage = 'You are the admin for this game';
        res.status(200).send(loginMessage);
      } else {
        db.logInUser(user.id, false);
        loginMessage = 'You are a player for this game';
        res.status(200).send(loginMessage);
      }
    } else {
      res.status(401).send('Login failed');
    }
  } else {
    res.status(401).send('Login failed');
  }
});

app.post('/uploadImage', (req, res) => {
  const imageData = req.body.imageData;
  const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
  const fileName = `image-${Date.now()}.png`;
  const savePath = path.join(__dirname, 'uploads', fileName);
  fs.writeFile(savePath, base64Data, 'base64', (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving image');
    } else {
      const imageUrl = `http://localhost:${PORT}/uploads/${fileName}`;
      const insertResponse = db.saveGameImage(imageUrl);
      if (insertResponse) res.json({ imageUrl });
    }
  });
});

app.post('/gameDescription', (req, res) => {
  const description = req.body.desc;
  console.log(description);
  const response = db.saveGameDescription(description);
  if (response) {
    res.status(200).send('Description saved successfully');
  } else {
    res.status(500).send('Error saving description');
  }
});

// app.post('/gameImage', (req, res) => {
//   const imagePath = req.body.imagePath;
//   const response = db.saveGameImage(imagePath);
//   if (response) {
//     res.status(200).send('Image saved successfully');
//   } else {
//     res.status(500).send('Error saving image');
//   }
// });

io.on('connection', (socket) => {
  socket.on('joinGame', (username) => {
    if (players.length == 0) {
      players.push({ id: socket.id, username: username, isAdmin: true });
    } else {
      players.push({ id: socket.id, username: username, isAdmin: false });
    }
    socket.emit('playerList', players);
    socket.broadcast.emit('newPlayerList', players);
    // if (players.length >= 2) {
    //   socket.emit('gameStart', 'Game has started');
    //   socket.broadcast.emit('joinGameStart', 'Game has started');
    // }
  });

  socket.on('start', () => {
    if (players.length >= 2) {
      socket.emit('gameStart', 'Game has started');
      socket.broadcast.emit('joinGameStart', 'Game has started');
    }
  });

  socket.on('getTurn', () => {
    if (players.length >= 2) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      players.forEach((player) => {
        player.turnType =
          player.id === randomPlayer.id ? 'drawing' : 'sentence';
      });
      socket.emit('turn', players);
      socket.broadcast.emit('activePlayer', players);
    }
  });

  // use socket to handle registeration of users and write the data to the database
  socket.on('register', (user) => {
    // Handle user registration and write the data to the database
    const hashedPassword = bycrypt.hashSync(user.password, 10);
    const response = db.registerUser({
      username: user.username,
      password: hashedPassword,
    });
    if (response) {
      socket.emit('registrationSuccess', 'User registered successfully');
    } else {
      socket.emit('registrationFailed', 'User registration failed');
    }
  });

  // console.log('A user connected');
  // players.push(socket.id);

  // if (players.length === 1) {
  //     // First player sends a sentence
  //     io.emit('turn', { playerId: players[currentPlayerIndex], turnType: 'sentence' });
  // } else if (players.length > 1) {
  //     // Notify all players of new connection, but not the first player
  //     io.emit('turn', { playerId: players[currentPlayerIndex], turnType: isDrawingTurn ? 'drawing' : 'sentence' });
  // }

  socket.on('sentence', (sentence) => {
    gameData.push({ type: 'sentence', content: sentence });
    isDrawingTurn = true;
    totalTurns++;

    if (totalTurns >= maxRounds * players.length * 2) {
      io.emit('gameOver', gameData); // Notify all players that the game is over
      resetGameState();
    } else {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      io.emit('endTurn', players[currentPlayerIndex]); // Signal end of turn
      io.emit('turn', {
        playerId: players[currentPlayerIndex],
        turnType: 'drawing',
        previousData: sentence,
      });
    }
  });

  socket.on('image', (imageData) => {
    gameData.push({ type: 'image', content: imageData });
    isDrawingTurn = false;
    totalTurns++;

    if (totalTurns >= maxRounds * players.length * 2) {
      io.emit('gameOver', gameData); // Notify all players that the game is over
      resetGameState();
    } else {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      io.emit('endTurn', players[currentPlayerIndex]); // Signal end of turn
      io.emit('turn', {
        playerId: players[currentPlayerIndex],
        turnType: 'sentence',
        previousData: imageData,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    players = players.filter((playerId) => playerId !== socket.id);
    if (players.length === 0) {
      // Reset game state if all players disconnect
      resetGameState();
    }
  });
});

function resetGameState() {
  gameData = [];
  currentPlayerIndex = 0;
  isDrawingTurn = false;
  totalTurns = 0;
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
