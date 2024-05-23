const sqlite3 = require('sqlite3').verbose();

// Create a new database connection
const db = new sqlite3.Database('broken-telephone.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the database.');
});

// Perform operations on the database
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            creted_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,
    (err) => {
      if (err) {
        return console.error('Error creating users table', err.message);
      }
      console.log('Created users table.');
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS loggedInUsers (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            isAdmin BOOLEAN DEFAULT 0,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`,
    (err) => {
      if (err) {
        return console.error('Error creating loggedInUsers table', err.message);
      }
      console.log('Created loggedInUsers table.');
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY,
            gameId TEXT NOT NULL,
            userId INTEGER NOT NULL,
            startedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            leftAt  DATETIME DEFAULT NULL,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`,
    (err) => {
      if (err) {
        return console.error('Error creating games table', err.message);
      }
      console.log('Created games table.');
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS gameImages (
            id INTEGER PRIMARY KEY,
            imagePath TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL 
        )`,
    (err) => {
      if (err) {
        return console.error('Error creating gameImages table', err.message);
      }
      console.log('Created gameImages table.');
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS gameDescriptions (
            id INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL 
        )`,
    (err) => {
      if (err) {
        return console.error(
          'Error creating gameDescriptions table',
          err.message
        );
      }
      console.log('Created gameDescriptions table.');
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS gameTurns (
            id INTEGER PRIMARY KEY,
            gameId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            gameAction INTEGER NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(gameId) REFERENCES games(id),
            FOREIGN KEY(userId) REFERENCES users(id)
        )`,
    (err) => {
      if (err) {
        return console.error('Error creating gameTurns table', err.message);
      }
      console.log('Created gameTurns table.');
    }
  );

  db.run(`DELETE FROM loggedInUsers`, (err) => {
    if (err) {
      return console.error('Error deleting loggedInUsers', err.message);
    }
    console.log('Deleted loggedInUsers.');
  });
});

db.registerUser = (user) => {
  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [user.username, user.password],
    (err) => {
      if (err) {
        return console.error('Error inserting user', err.message);
      }
      console.log('User inserted.');
      return true;
    }
  );
};

db.getUser = (username) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) {
        reject(err);
      }
      resolve(row);
    });
  });
};

db.saveGameImage = (imagePath) => {
  db.run(
    `INSERT INTO gameImages (imagePath) VALUES (?)`,
    [imagePath],
    (err) => {
      if (err) {
        return console.error('Error inserting game image', err.message);
      }
      console.log('Game image inserted.');
      return true;
    }
  );
};

db.saveGameDescription = (description) => {
  db.run(
    `INSERT INTO gameDescriptions (description) VALUES (?)`,
    [description],
    (err) => {
      if (err) {
        return console.error('Error inserting game description', err.message);
      }
      console.log('Game description inserted.');
      return true;
    }
  );
};

db.logInUser = (userId, isAdmin) => {
  db.run(
    `INSERT INTO loggedInUsers (userId, isAdmin) VALUES (?, ?)`,
    [userId, isAdmin],
    (err) => {
      if (err) {
        return console.error('Error logging in user', err.message);
      }
      console.log('User logged in.');
      return true;
    }
  );
};
// Close the database connection
// db.close();

module.exports = db;
