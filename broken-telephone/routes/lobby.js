const express = require('express');
const db = require('../db');
const router = express.Router();

let loggedUsers = [];
let gameStarted = false;
let adminUser = null;

// Check lobby status
router.get('/', (req, res) => {
  if (loggedUsers.length < 3) {
    return res.status(200).json({ message: "Waiting for more players", players: loggedUsers });
  }
  if (gameStarted) {
    return res.status(200).json({ message: "Game already started", players: loggedUsers });
  }
  res.status(200).json({ message: "Ready to start", players: loggedUsers, admin: adminUser });
});

// Admin starts the game
router.post('/start-game', (req, res) => {
  if (req.session.username !== adminUser) {
    return res.status(403).json({ error: "Only the admin can start the game" });
  }
  if (loggedUsers.length < 3) {
    return res.status(400).json({ error: "Need at least 3 players to start the game" });
  }
  gameStarted = true;
  res.status(200).json({ message: "Game started" });
});

module.exports = router;
