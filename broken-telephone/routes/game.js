const express = require('express');
const db = require('../db');
const router = express.Router();

// Add image and description
router.post('/images', (req, res) => {
  if (!gameStarted) {
    return res.status(400).json({ error: "Game has not started yet" });
  }
  const { description, imageUrl } = req.body;
  const username = req.session.username;

  db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(400).json({ error: "User not found" });
    }

    db.run(`INSERT INTO images (user_id, description, image_url) VALUES (?, ?, ?)`, [row.id, description, imageUrl], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Image and description added successfully" });
    });
  });
});

// Get images and descriptions
router.get('/images', (req, res) => {
  db.all(`SELECT users.username, images.description, images.image_url 
          FROM images 
          JOIN users ON images.user_id = users.id`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

module.exports = router;
