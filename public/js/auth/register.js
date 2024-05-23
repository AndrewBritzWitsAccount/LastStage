import { socketConnection } from '../socketConnection.js';

document
  .getElementById('register-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    socketConnection.emit('register', { username, password });
    // move to login page on registration success
    // socketConnection.on('registrationSuccess', (message) => {
    //   console.log(message);
    //   window.location.href = '/login';
    // });

    document.getElementById('register-form').reset();
  });
