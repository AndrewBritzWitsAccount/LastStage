const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Register user
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO registeredUsers (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
        if (err) {
            return res.status(400).json({ error: "Username already exists" });
        }
        res.status(200).json({ message: "Registration successful. You can now login." });
    });
});

// Login user
router.post('/login', (req, res) => {
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

module.exports = router;
