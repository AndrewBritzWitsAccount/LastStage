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
let gameId = '';
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

app.get('/uploads/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const imagePath = path.join(__dirname, 'uploads', fileName);
  res.sendFile(imagePath);
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
  if (user != null) {
    const present = await db.checkIfLoggedIn(user.id);
    let loginMessage = 'Login successful';

    if (user && !present) {
      const isPasswordCorrect = bycrypt.compareSync(password, user.password);
      if (isPasswordCorrect) {
        if (players.length === 0) {
          db.logInUser(user.id, true);
          loginMessage = 'You are the admin for this game';
          // return response with user id
          return res.status(200).send({ loginMessage, userId: user.id });
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
  }
  // else {
  //   alert('Not registered or wrong password. Go back and register');
  // }
});

app.post('/uploadImage', async (req, res) => {
  const imageData = req.body.imageData;
  const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
  const fileName = `image-${Date.now()}.png`;
  const savePath = path.join(__dirname, 'uploads', fileName);
  fs.writeFile(savePath, base64Data, 'base64', async (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving image');
    } else {
      const imageUrl = `/uploads/${fileName}`;
      await db.saveGameImage(imageUrl, gameId);
      gameData.push({
        type: 'image',
        content: imageUrl,
        username: players[currentPlayerIndex].username,
        time: new Date(),
      });
      res.status(200).send('Image saved successfully');
    }
  });
});

app.get('/userId', async (req, res) => {
  const username = req.body.username;
  const user = await db.getUser(username);
  if (user) {
    res.status(200).send(user.id);
  } else {
    res.status(500).send('Error getting user id');
  }
});

app.post('/gameDescription', (req, res) => {
  const description = req.body.desc;
  console.log(description);
  const response = db.saveGameDescription(description, gameId);
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
    gameId = `${socket.id}-${Date.now()}`;
    if (players.length == 0) {
      players.push({ id: socket.id, username: username, isAdmin: true });
    } else {
      players.push({ id: socket.id, username: username, isAdmin: false });
    }
    socket.emit('playerList', players);
    io.emit('newPlayerList', players);
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
    if (players.length >= 2 && players.length <= 5) {
      const randomPlayer = players[0];
      socket.emit('startTurn', {
        player: randomPlayer.username,
        currentPlayerIndex: players.indexOf(randomPlayer),
        turnType: 'sentence',
      });
      //   socket.broadcast.emit('activePlayer', {
      //     players,
      //     currentPlayerIndex: currentPlayerIndex,
      //     turnType: isDrawingTurn ? 'drawing' : 'sentence',
      //   });
    }
  });

  // use socket to handle registeration of users and write the data to the database
  socket.on('register', async (user) => {
    // Handle user registration and write the data to the database
    const hashedPassword = bycrypt.hashSync(user.password, 10);
    const response = await db.registerUser({
      username: user.username,
      password: hashedPassword,
    });
    if (response) {
      socket.emit('registrationSuccess', 'User registered successfully');
    } else {
      socket.emit('registrationFailed', 'User registration failed');
    }
  });

  socket.on('sentence', async (sentence) => {
    // description = await db.getDescription(sentence);
    gameData.push({
      type: 'sentence',
      content: sentence,
      username: players[currentPlayerIndex].username,
      time: new Date(),
    });
    isDrawingTurn = true;
    totalTurns++;
    if (totalTurns == maxRounds * players.length * 2) {
      io.emit('gameOver', gameData); // Notify all players that the game is over
      resetGameState();
    } else {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

      //   socket.emit('endTurn', players[currentPlayerIndex]); // Signal end of turn

      io.emit('turn', {
        player: players[currentPlayerIndex].username,
        turnType: isDrawingTurn ? 'drawing' : 'sentence',
        previousData: sentence,
      });
      //   socket.broadcast.emit('turn', {
      //     player: players[currentPlayerIndex].username,
      //     turnType: isDrawingTurn ? 'drawing' : 'sentence',
      //     previousData: sentence,
      //   });
    }
  });

  socket.on('image', () => {
    // gameData.push({ type: 'image', content: imageData });
    isDrawingTurn = false;
    totalTurns++;

    if (totalTurns == maxRounds * players.length * 2) {
      io.emit('gameOver', gameData); // Notify all players that the game is over

      console.log('game over');
    } else {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      socket.emit('endTurn', players[currentPlayerIndex]); // Signal end of turn
      io.emit('turn', {
        player: players[currentPlayerIndex].username,
        turnType: isDrawingTurn ? 'drawing' : 'sentence',
      });
      //   socket.broadcast.emit('turn', {
      //     player: players[currentPlayerIndex].username,
      //     turnType: isDrawingTurn ? 'drawing' : 'sentence',
      //   });
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
  socket.on('show-stats', () => {
    io.emit('display-stats', gameData);
    resetGameState();
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