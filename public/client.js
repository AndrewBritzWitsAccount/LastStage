const socket = io();
const previousCanvas = document.getElementById('previous-drawing-canvas');
const currentCanvas = document.getElementById('current-drawing-canvas');
const previousContext = previousCanvas.getContext('2d');
const currentContext = currentCanvas.getContext('2d');
const sentenceInput = document.getElementById('sentence-input');
const previousTextContainer = document.getElementById('previous-text-container');
const previousTextElement = document.getElementById('previous-text');
const yourDrawingTitle = document.getElementById('your-drawing-title');
const previousCanvasContainer = document.getElementById('previous-canvas-container');
const currentCanvasContainer = document.getElementById('current-canvas-container');
let isDrawing = false;
let currentTurnType = 'sentence';
let isMyTurn = false;

// Function to resize the canvas
function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// Initial resizing of the canvases
resizeCanvas(previousCanvas);
resizeCanvas(currentCanvas);

window.addEventListener('resize', () => {
    resizeCanvas(previousCanvas);
    resizeCanvas(currentCanvas);
});

socket.on('turn', ({ playerId, turnType, previousData }) => {
    currentTurnType = turnType;
    isMyTurn = playerId === socket.id;

    console.log(`Turn type: ${turnType}, Is my turn: ${isMyTurn}, Player ID: ${playerId}`);

    if (isMyTurn) {
        document.getElementById('turn-info').innerText = 'Your Turn!';
        document.getElementById('submit-button').disabled = false;

        if (turnType === 'sentence') {
            sentenceInput.classList.remove('hidden');
            currentCanvasContainer.style.display = 'none';
            previousCanvasContainer.style.display = previousData ? 'block' : 'none';
            if (previousData) {
                const img = new Image();
                img.onload = () => {
                    resizeCanvas(previousCanvas); // Resize canvas before drawing
                    previousContext.clearRect(0, 0, previousCanvas.width, previousCanvas.height);
                    previousContext.drawImage(img, 0, 0, previousCanvas.width, previousCanvas.height);
                };
                img.src = previousData;
            }
            sentenceInput.focus();
            yourDrawingTitle.style.display = 'none';
        } else if (turnType === 'drawing') {
            sentenceInput.classList.add('hidden');
            currentCanvasContainer.style.display = 'block';
            previousCanvasContainer.style.display = 'none';
            previousTextContainer.style.display = 'block';
            previousTextElement.innerText = previousData;
            yourDrawingTitle.style.display = 'block';
            currentCanvas.classList.remove('hidden');
            enableDrawing();
            console.log('Drawing enabled for player');
        }
    } else {
        document.getElementById('turn-info').innerText = 'Waiting for other players...';
        document.getElementById('submit-button').disabled = true;
        previousTextContainer.style.display = 'none';
        previousCanvasContainer.style.display = 'none';
        yourDrawingTitle.style.display = 'none';

        if (turnType === 'sentence') {
            sentenceInput.classList.add('hidden');
        } else {
            currentCanvasContainer.style.display = 'none';
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

socket.on('gameOver', (gameData) => {
    document.getElementById('turn-info').innerText = 'Game Over!';
    document.getElementById('submit-button').disabled = true;
    sentenceInput.classList.add('hidden');
    currentCanvasContainer.style.display = 'none';
    previousCanvasContainer.style.display = 'none';
    yourDrawingTitle.style.display = 'none';
    disableDrawing();

    // Display the final game data
    const textHistory = document.getElementById('text-history');
    textHistory.innerHTML = '<h2>Final Game Data</h2>';
    gameData.forEach(item => {
        if (item.type === 'sentence') {
            const sentenceElement = document.createElement('p');
            sentenceElement.innerText = item.content;
            textHistory.appendChild(sentenceElement);
        } else if (item.type === 'image') {
            const img = new Image();
            img.src = item.content;
            textHistory.appendChild(img);
        }
    });
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
        resizeCanvas(previousCanvas); // Resize canvas before drawing
        previousContext.clearRect(0, 0, previousCanvas.width, previousCanvas.height);
        previousContext.drawImage(img, 0, 0, previousCanvas.width, previousCanvas.height);
    };
    img.src = imageData;
});

function startDrawing(e) {
    if (!isMyTurn) return;
    isDrawing = true;
    currentContext.beginPath(); // Start a new path when drawing starts
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    currentContext.lineWidth = 3;
    currentContext.lineCap = 'round';
    currentContext.strokeStyle = '#000';
    const rect = currentCanvas.getBoundingClientRect();
    currentContext.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    currentContext.stroke();
    currentContext.beginPath();
    currentContext.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    currentContext.beginPath(); // Reset the path when drawing stops
}

function enableDrawing() {
    currentCanvas.addEventListener('mousedown', startDrawing);
    currentCanvas.addEventListener('mousemove', draw);
    currentCanvas.addEventListener('mouseup', stopDrawing);
    currentCanvas.addEventListener('mouseout', stopDrawing);
    console.log('Drawing events enabled');
}

function disableDrawing() {
    currentCanvas.removeEventListener('mousedown', startDrawing);
    currentCanvas.removeEventListener('mousemove', draw);
    currentCanvas.removeEventListener('mouseup', stopDrawing);
    currentCanvas.removeEventListener('mouseout', stopDrawing);
    console.log('Drawing events disabled');
}

function handleSubmit() {
    if (currentTurnType === 'sentence') {
        const sentence = sentenceInput.value;
        socket.emit('sentence', sentence);
        sentenceInput.value = '';

        updateDisplay();
        currentTurnType = 'drawing';
    } else if (currentTurnType === 'drawing') {
        const imageData = currentCanvas.toDataURL('image/png');
        socket.emit('image', imageData);
        clearCanvas(currentContext, currentCanvas);

        updateDisplay();
        currentTurnType = 'sentence';
    }
}

document.getElementById('submit-button').addEventListener('click', handleSubmit);

function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

// Make sure only the stuff a player needs is displayed
function updateDisplay() {
    if (currentTurnType === 'sentence') {
        yourDrawingTitle.style.display = 'none';
        currentCanvasContainer.style.display = 'none';
        previousCanvasContainer.style.display = 'block';
    } else if (currentTurnType === 'drawing') {
        previousTextContainer.style.display = 'none';
        currentCanvasContainer.style.display = 'block';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});
