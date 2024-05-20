const socket = io();

socket.on('turn', currentPlayer => {
    if (currentPlayer === socket.id) {
        document.getElementById('text-input').disabled = false;
        document.getElementById('submit-button').disabled = false;
    } else {
        document.getElementById('text-input').disabled = true;
        document.getElementById('submit-button').disabled = true;
    }
});

document.getElementById('submit-button').addEventListener('click', () => {
    const message = document.getElementById('text-input').value;
    socket.emit('message', message);
    document.getElementById('text-input').value = '';
});

socket.on('message', ({ player, text }) => {
    const textHistory = document.getElementById('text-history');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${player}: ${text}`;
    textHistory.appendChild(messageElement);
});
