const currentCanvas = document.getElementById('current-drawing-canvas');
const currentContext = currentCanvas.getContext('2d');
const canvasParent = document.getElementById('current-canvas-container');
currentCanvas.width = canvasParent.clientWidth;
currentCanvas.height = canvasParent.clientHeight;
currentContext.lineWidth = 5;
currentContext.lineCap = 'round';
currentContext.strokeStyle = 'black';

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Function draw() to draw on the canvas
function draw(event) {
  if (!isDrawing) return;
  var x = event.pageX - currentCanvas.offsetLeft;
  var y = event.pageY - currentCanvas.offsetTop;
  currentContext.lineTo(x, y);
  currentContext.stroke();
}

// Function startDrawing() to start drawing on the canvas
function startDrawing(event) {
  isDrawing = true;
  currentContext.beginPath();
  currentContext.moveTo(
    event.pageX - currentCanvas.offsetLeft,
    event.pageY - currentCanvas.offsetTop
  );
}

// Function stopDrawing() to stop drawing on the canvas
function stopDrawing() {
  isDrawing = false;
}

// Function clearCanvas() to clear the canvas
// function clearCanvas() {
//   currentContext.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
// }

// Add event listeners for drawing
currentCanvas.addEventListener('mousedown', startDrawing);
currentCanvas.addEventListener('mousemove', draw);
currentCanvas.addEventListener('mouseup', stopDrawing);
currentCanvas.addEventListener('mouseout', stopDrawing);

// add onclick event to convert canvas to image
document.getElementById('submit-button').addEventListener('click', async () => {
  const image = currentCanvas.toDataURL('image/png');
  const response = await fetch('/uploadImage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData: image }),
  });
  if (response.ok) {
    console.log('Image uploaded successfully');
  }
});