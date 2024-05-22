const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'broken-telephone-game-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

let players = [];
let currentPlayerIndex = 0;
let gameData = [];
let isDrawingTurn = false; // Track if the current turn is for drawing or writing

io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', ({ username }) => {
    players.push({ id: socket.id, username });
    console.log("the code gets here")
    console.log('Players:', players);
    if (players.length === 1) {
      io.emit('turn', { playerId: players[currentPlayerIndex].id, turnType: 'sentence' });
    } else {
      io.emit('turn', { playerId: players[currentPlayerIndex].id, turnType: isDrawingTurn ? 'drawing' : 'sentence' });
    }
  });

  socket.on('sentence', sentence => {
    gameData.push({ type: 'sentence', content: sentence });
    isDrawingTurn = true;
    io.emit('endTurn', players[currentPlayerIndex].id); // Signal end of turn
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    io.emit('turn', { playerId: players[currentPlayerIndex].id, turnType: 'drawing', previousData: sentence });
  });

  socket.on('image', imageData => {
    gameData.push({ type: 'image', content: imageData });
    isDrawingTurn = false;
    io.emit('endTurn', players[currentPlayerIndex].id); // Signal end of turn
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    io.emit('turn', { playerId: players[currentPlayerIndex].id, turnType: 'sentence', previousData: imageData });
  });


  //   socket.on('disconnect', () => {
  //     console.log('A user disconnected:', socket.id);
  //     players = players.filter(player => player.id !== socket.id);
  //     if (players.length === 0) {
  //       // Reset game state if all players disconnect
  //       gameData = [];
  //       currentPlayerIndex = 0;
  //       isDrawingTurn = false;
  //     }
  //   });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM registeredUsers WHERE username = ?`, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row || !bcrypt.compareSync(password, row.password)) {
      return res.status(400).json({ error: "Invalid username or password" });
    } else {
      req.session.username = username;

      db.get(`SELECT COUNT(*) as count FROM loggedInUsers`, (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const isAdmin = row.count === 0 ? 1 : 0;
        db.run(`INSERT INTO loggedInUsers (username, isAdmin) VALUES (?, ?)`, [username, isAdmin], function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.status(200).json({ message: "Login successful", isAdmin });
        });
      });
    }
  });
});

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO registeredUsers (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
    if (err) {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(200).json({ message: "Registration successful" });
  });
});

app.get('/lobby', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
});

app.get('/logged-users', (req, res) => {
  db.all(`SELECT username, isAdmin FROM loggedInUsers`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/start-game', (req, res) => {
  const { username } = req.body;

  db.get(`SELECT * FROM loggedInUsers WHERE username = ?`, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    console.log("There are " + players.length + " players ");
    console.log("the admin is " + username);
    if (row.isAdmin) {
      // Admin-specific logic (if any)
    }

    if (players.length >= 0) {   // row && row.isAdmin && 
      // Notify all players to start the game
      io.emit('startGame');
      res.json({ message: 'Game started!' });
    } else {
      res.status(400).json({ error: 'Not enough players or not authorized' });
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
