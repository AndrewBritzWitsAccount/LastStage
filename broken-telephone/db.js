const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the database');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS registeredUsers (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating registeredUsers table:', err.message);
        } else {
            console.log('registeredUsers table created successfully');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS loggedInUsers (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        isAdmin INTEGER
    )`, (err) => {
        if (err) {
            console.error('Error creating loggedInUsers table:', err.message);
        } else {
            console.log('loggedInUsers table created successfully');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY,
        filename TEXT,
        description TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating images table:', err.message);
        } else {
            console.log('images table created successfully');
        }
    });

    // Clear loggedInUsers table on server start
    db.run(`DELETE FROM loggedInUsers`, (err) => {
        if (err) {
            console.error('Error clearing loggedInUsers table:', err.message);
        } else {
            console.log('loggedInUsers table cleared');
        }
    });
});

module.exports = db;
