const db = {
  getUser: jest.fn(),
  checkIfLoggedIn: jest.fn(),
  logInUser: jest.fn(),
  saveGameImage: jest.fn(),
  saveGameDescription: jest.fn(),
  registerUser: jest.fn(),
};

module.exports = db;
