document.addEventListener('DOMContentLoaded', function () {
    const socket = io();

    const loginButton = document.getElementById('login-button');
    const credentialsForm = document.getElementById('credentials-form');
    const userListDiv = document.getElementById('users-list');
    const startGameButton = document.getElementById('start-game-button');
    const waitingMessage = document.getElementById('waiting-message');
    const gameScreen = document.getElementById('game-screen');
    const gameForm = document.getElementById('game-form');
    const gameInput = document.getElementById('game-input');
    const gameStateDiv = document.getElementById('game-state');

    userListDiv.style.display = 'none';
    gameScreen.style.display = 'none';

    let loggedIn = false;
    let isMyTurn = false;

    function isLoggedIn() {
        return localStorage.getItem('sessionToken') !== null;
    }

    function login(username, password) {
        socket.emit('setUserCredentials', { username, password });
        credentialsForm.style.display = 'none';
        localStorage.setItem('sessionToken', true);
    }

    if (isLoggedIn()) {
        credentialsForm.style.display = 'none';
    }

    loginButton.addEventListener('click', function (event) {
        event.preventDefault();

        const username = document.getElementById('username-input').value.trim();
        const password = document.getElementById('password-input').value.trim();

        if (username !== '' && password !== '') {
            login(username, password);
            loggedIn = true;
        }
    });

    socket.on('userConnected', function (users) {
        if (isLoggedIn()) {
            updateUserList(users);
            userListDiv.style.display = 'block';
        }
    });

    socket.on('waitingForStartGame', function () {
        startGameButton.style.display = 'block';
        waitingMessage.style.display = 'none';
    });

    socket.on('gameStarted', function (currentTurnId) {
        userListDiv.style.display = 'none';
        gameScreen.style.display = 'block';
        updateGameState([], currentTurnId);
    });

    socket.on('gameStateUpdate', function (gameState, currentTurnId) {
        updateGameState(gameState, currentTurnId);
    });

    socket.on('gameStopped', function () {
        gameScreen.style.display = 'none';
        userListDiv.style.display = 'block';
    });

    function updateUserList(users) {
        const userList = document.getElementById('user-list');
        userList.innerHTML = '';

        users.forEach(function (user) {
            const li = document.createElement('li');
            li.textContent = user.username;
            userList.appendChild(li);
        });
    }

    startGameButton.addEventListener('click', function () {
        socket.emit('startGame');
    });

    gameForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (isMyTurn) {
            const text = gameInput.value.trim();
            if (text !== '') {
                socket.emit('submitText', text);
                gameInput.value = '';
            }
        }
    });

    function updateGameState(gameState, currentTurnId) {
        gameStateDiv.innerHTML = '';
        gameState.forEach(entry => {
            const p = document.createElement('p');
            p.textContent = `${entry.username}: ${entry.text}`;
            gameStateDiv.appendChild(p);
        });

        isMyTurn = socket.id === currentTurnId;
        gameInput.disabled = !isMyTurn;
        if (isMyTurn) {
            gameInput.focus();
        }
    }
});
