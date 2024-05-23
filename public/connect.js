// This file is used to establish a connection to the server using socket.io

const socketURL = 'http://localhost:3000'; // Replace with your server URL
const socketOptions = {
  transports: ['websocket'],
};

const socketConnection = io(socketURL, socketOptions);

// Export the socket connection function
module.exports = socketConnection;
