const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

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
        db.run(`INSERT INTO loggedInUsers (username, isAdmin) VALUES (?, ?)`, [username, isAdmin], function(err) {
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

    if (row && row.isAdmin && rows.length >= 3) {
      // Logic to start the game
      res.json({ message: 'Game started!' });
    } else {
      res.status(400).json({ error: 'Not enough players or not authorized' });
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
