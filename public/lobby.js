const socket = io();

const username = localStorage.getItem('username');

socket.emit('joinGame', username);

function updatePlayerList(players) {
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
});

socket.on('newPlayerList', (players) => {
  updatePlayerList(players);
});

socket.on('gameStart', (message) => {
  console.log(message);
  window.location.href = '/game';
});

socket.on('joinGameStart', (message) => {
  console.log(message);
  window.location.href = '/game';
});
