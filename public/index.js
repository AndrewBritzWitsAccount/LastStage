import socketConnection from './connect';

// Get the reference to the content element
const contentElement = document.getElementById('content');

// Function to load HTML file into the content element
function loadHTMLFile(file) {
  fetch(file)
    .then((response) => response.text())
    .then((html) => {
      contentElement.innerHTML = html;
    })
    .catch((error) => {
      console.error('Error loading HTML file:', error);
    });
}
const username = localStorage.getItem('username');
socketConnection.emit('joinGame', { username });
if (username !== null) {
  loadHTMLFile('lobby.html');
}
