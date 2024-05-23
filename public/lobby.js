const socket = io();
let players = [];
const username = localStorage.getItem('username');

socket.emit('joinGame', username);

function updatePlayerList(players) {
  players = players;
  const playerList = document.getElementById('player-list');
  playerList.innerHTML = '';
  players.forEach((player, index) => {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(player.username));
    playerList.appendChild(li);
  });
}

// insert data into the list on the lobby page
socket.on('playerList', (players) => {
  updatePlayerList(players);
  players.forEach((player) => {
    // if player is same username as the current user, enable the start game button
    if (player.username === username && player.isAdmin) {
      window.localStorage.setItem('isAdmin', true);
      document.getElementById('start-game').disabled = false;
    }
  });
});

socket.on('newPlayerList', (players) => {
  updatePlayerList(players);
});

// add event listener to start game button
document.getElementById('start-game').addEventListener('click', () => {
  socket.emit('start');
});

socket.on('gameStart', (message) => {
  console.log(message);
  window.location.href = '/game';
});

socket.on('joinGameStart', (message) => {
  console.log(message);
  window.location.href = '/game';
});
