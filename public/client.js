const socket = io();
const previousCanvas = document.getElementById('previous-drawing-canvas');
const currentCanvas = document.getElementById('current-drawing-canvas');
const previousContext = previousCanvas.getContext('2d');
const currentContext = currentCanvas.getContext('2d');
const sentenceInput = document.getElementById('sentence-input');
let isDrawing = false;
let currentTurnType = '';
let isMyTurn = false;

socket.on('turn', ({ playerId, turnType }) => {
    currentTurnType = turnType;
    isMyTurn = playerId === socket.id;
    
    if (isMyTurn) {
        document.getElementById('turn-info').innerText = 'Your Turn!';
        document.getElementById('submit-button').disabled = false;

        if (turnType === 'sentence') {
            sentenceInput.classList.remove('hidden');
            currentCanvas.classList.add('hidden');
            sentenceInput.focus();
        } else {
            sentenceInput.classList.add('hidden');
            currentCanvas.classList.remove('hidden');
            enableDrawing();
        }
    } else {
        document.getElementById('turn-info').innerText = 'Waiting for other players...';
        document.getElementById('submit-button').disabled = true;

        if (turnType === 'sentence') {
            sentenceInput.classList.add('hidden');
        } else {
            currentCanvas.classList.add('hidden');
            disableDrawing();
        }
    }
});

socket.on('endTurn', (playerId) => {
    if (playerId === socket.id) {
        disableDrawing();
    }
});

socket.on('sentence', sentence => {
    const textHistory = document.getElementById('text-history');
    const sentenceElement = document.createElement('p');
    sentenceElement.innerText = sentence;
    textHistory.appendChild(sentenceElement);
});

socket.on('image', imageData => {
    previousCanvas.classList.remove('hidden');
    const img = new Image();
    img.onload = () => {
        previousContext.drawImage(img, 0, 0, previousCanvas.width, previousCanvas.height);
    };
    img.src = imageData;
});

function startDrawing(e) {
    if (!isMyTurn) return;
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    currentContext.lineWidth = 3;
    currentContext.lineCap = 'round';
    currentContext.strokeStyle = '#000';
    currentContext.lineTo(e.clientX - currentCanvas.getBoundingClientRect().left, e.clientY - currentCanvas.getBoundingClientRect().top);
    currentContext.stroke();
    currentContext.beginPath();
    currentContext.moveTo(e.clientX - currentCanvas.getBoundingClientRect().left, e.clientY - currentCanvas.getBoundingClientRect().top);
}

function stopDrawing() {
    isDrawing = false;
    currentContext.beginPath();
}

function enableDrawing() {
    currentCanvas.addEventListener('mousedown', startDrawing);
    currentCanvas.addEventListener('mousemove', draw);
    currentCanvas.addEventListener('mouseup', stopDrawing);
    currentCanvas.addEventListener('mouseout', stopDrawing);
}

function disableDrawing() {
    currentCanvas.removeEventListener('mousedown', startDrawing);
    currentCanvas.removeEventListener('mousemove', draw);
    currentCanvas.removeEventListener('mouseup', stopDrawing);
    currentCanvas.removeEventListener('mouseout', stopDrawing);
}

document.getElementById('submit-button').addEventListener('click', () => {
    if (currentTurnType === 'sentence') {
        const sentence = sentenceInput.value;
        socket.emit('sentence', sentence);
        sentenceInput.value = '';
    } else {
        const imageData = currentCanvas.toDataURL('image/png');
        socket.emit('image', imageData);
        clearCanvas(currentContext, currentCanvas);
    }
});

function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
