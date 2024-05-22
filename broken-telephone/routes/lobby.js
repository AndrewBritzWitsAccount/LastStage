document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('/logged-users');
  const users = await response.json();

  const usersList = document.getElementById('users');
  users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = `${user.username} ${user.isAdmin ? '(Admin)' : ''}`;
      usersList.appendChild(li);
  });

  const username = localStorage.getItem('username');
  const loggedInUser = users.find(user => user.username === username);

  // Notify the server that this user joined the game
  const socket = io();
  socket.emit('joinGame', { username });

  if (loggedInUser && loggedInUser.isAdmin) {
      const startGameButton = document.getElementById('startGameButton');
      startGameButton.style.display = 'block';
      startGameButton.addEventListener('click', async () => {
          const startResponse = await fetch('/start-game', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
          });

          const result = await startResponse.json();
          if (startResponse.status === 200) {
              alert('Game started!');
              // Redirect to the game page
              window.location.href = '../game.html';
          } else {
              alert(result.error);
          }
      });
  }
});
