const socket = io();
const previousCanvas = document.getElementById('previous-drawing-canvas');
const currentCanvas = document.getElementById('current-drawing-canvas');
const previousContext = previousCanvas.getContext('2d');
const currentContext = currentCanvas.getContext('2d');
let isDrawing = false;

socket.on('turn', currentPlayer => {
    if (currentPlayer === socket.id) {
        if (!previousCanvas.classList.contains('hidden')) {
            previousCanvas.classList.add('hidden');
        }
        if (currentCanvas.classList.contains('hidden')) {
            currentCanvas.classList.remove('hidden');
        }
        currentCanvas.addEventListener('mousedown', startDrawing);
        currentCanvas.addEventListener('mousemove', draw);
        currentCanvas.addEventListener('mouseup', stopDrawing);
        currentCanvas.addEventListener('mouseout', stopDrawing);
        document.getElementById('submit-button').disabled = false;
    } else {
        if (!previousCanvas.classList.contains('hidden')) {
            previousCanvas.classList.add('hidden');
        }
        if (!currentCanvas.classList.contains('hidden')) {
            currentCanvas.classList.add('hidden');
        }
        currentCanvas.removeEventListener('mousedown', startDrawing);
        currentCanvas.removeEventListener('mousemove', draw);
        currentCanvas.removeEventListener('mouseup', stopDrawing);
        currentCanvas.removeEventListener('mouseout', stopDrawing);
        document.getElementById('submit-button').disabled = true;
    }
});

socket.on('image', ({ player, imageData }) => {
    if (player !== socket.id) {
        previousCanvas.classList.remove('hidden');
        const img = new Image();
        img.onload = () => {
            previousContext.drawImage(img, 0, 0, previousCanvas.width, previousCanvas.height);
        };
        img.src = imageData;
    }
});

function startDrawing(e) {
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

document.getElementById('submit-button').addEventListener('click', () => {
    const imageData = currentCanvas.toDataURL('image/png');
    socket.emit('image', imageData);
    clearCanvas(currentContext, currentCanvas);
});

function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
