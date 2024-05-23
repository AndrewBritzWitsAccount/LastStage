const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  id: 'testSocketId',
};

const io = jest.fn(() => mockSocket);

module.exports = io;
