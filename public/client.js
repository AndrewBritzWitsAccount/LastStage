const socket = io();
const previousCanvas = document.getElementById('previous-drawing-canvas');
const previousCanvasContainer = document.getElementById('previous-canvas-container');
const currentCanvas = document.getElementById('current-drawing-canvas');
const previousContext = previousCanvas.getContext('2d');
const currentContext = currentCanvas.getContext('2d');
const sentenceInput = document.getElementById('sentence-input');
const previousTextContainer = document.getElementById('previous-text-container');
const previousTextElement = document.getElementById('previous-text');
const yourDrawingTitle = document.getElementById('your-drawing-title');
let isDrawing = false;
let currentTurnType = 'sentence';
let isMyTurn = false;
let roundType = 'text';

socket.on('turn', ({ playerId, turnType, previousData }) => {
    currentTurnType = turnType;
    isMyTurn = playerId === socket.id;

    if (isMyTurn) {
        document.getElementById('turn-info').innerText = 'Your Turn!';
        document.getElementById('submit-button').disabled = false;

        if (turnType === 'sentence') {
            sentenceInput.classList.remove('hidden');
            currentCanvas.classList.add('hidden');
            previousCanvasContainer.style.display = previousData ? 'block' : 'none'; // Show previous canvas only if there's previous data
            const img = new Image();
            img.onload = () => {
                previousContext.clearRect(0, 0, previousCanvas.width, previousCanvas.height); // Clear previous drawing
                previousContext.drawImage(img, 0, 0, previousCanvas.width, previousCanvas.height);
            };
            img.src = previousData;
            sentenceInput.focus();
            yourDrawingTitle.style.display = 'none'; // Hide "Your Drawing" title
            turnType = 'drawing';
        } else if (turnType === 'drawing'){
            sentenceInput.classList.add('hidden');
            currentCanvas.classList.remove('hidden');
            previousCanvasContainer.style.display = 'none';
            previousTextContainer.style.display = 'block';
            previousTextElement.innerText = previousData;
            enableDrawing();
            yourDrawingTitle.style.display = 'block'; // Show "Your Drawing" title
            turnType = 'sentence';
        }
    } else {
        document.getElementById('turn-info').innerText = 'Waiting for other players...';
        document.getElementById('submit-button').disabled = true;
        previousTextContainer.style.display = 'none';
        previousCanvasContainer.style.display = 'none';
        yourDrawingTitle.style.display = 'none'; // Hide "Your Drawing" title

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
    const img = new Image();
    img.onload = () => {
        previousContext.clearRect(0, 0, previousCanvas.width, previousCanvas.height); // Clear previous drawing
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

        displayedText();
        currentTurnType = 'drawing';
    } else if (currentTurnType === 'drawing'){
        const imageData = currentCanvas.toDataURL('image/png');
        socket.emit('image', imageData);
        clearCanvas(currentContext, currentCanvas);

        displayedText();
        currentTurnType = 'sentence';
    }

});

function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas
        .width, canvas.height);
}

// Make sure only the stuff a player needs is displayed
console.log(currentTurnType);

function displayedText() {
    console.log(currentTurnType);

    if (currentTurnType === 'sentence') {
        yourDrawingTitle.style.display = 'none';
    } else if (currentTurnType === 'drawing'){
        previousTextContainer.style.display = 'none';
    } 
}