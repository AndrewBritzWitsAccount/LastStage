const username = window.localStorage.getItem('username');

socket = io();
socket.emit('getTurn');
let players = [];

socket.on('startTurn', (data) => {
  if (data.player === username) {
    if (data.turnType == 'sentence') {
      enableSentenceInput();
    }
  } else {
    enableText(data.player, data.turnType);
  }
});

// socket.on('activePlayer', (data) => {
//   const index = data.currentPlayerIndex;
//   players = data.players;
//   console.log('username', username);
//   console.log(data.turnType);
//   if (index === players.indexOf(username)) {
//     console.log('active player');
//     if (data.turnType === 'sentence') {
//       enableSentenceInput();
//     } else if (data.turnType === 'drawing') {
//       disableSentenceInput();
//     }
//   } else {
//     enableText(players[index].username, data.turnType);
//   }
// });

socket.on('turn', (data) => {
  const { player, turnType } = data;
  console.log('players', username);
  if (player === username) {
    if (turnType === 'sentence') {
      enableSentenceInput();
    } else if (turnType === 'drawing') {
      disableSentenceInput();
    }
  } else {
    enableText(player, turnType);
  }
});

socket.on('gameOver', (gameData) => {
  console.log('Game Over');
  console.log(gameData);
  // sort gameData by the time it has for each entry ascending order
  gameData.sort((a, b) => new Date(a.time) - new Date(b.time));

  // insert a text into html div with id dispal-text
  document.getElementById('display-text').innerHTML = 'Game Over';

  const isAdmin = window.localStorage.getItem('isAdmin');
  if (isAdmin) document.getElementById('show-stats').classList.remove('hidden');

  document.getElementById('show-stats').addEventListener('click', () => {
    socket.emit('show-stats');
  });

  window.localStorage.removeItem('isAdmin');
  window.localStorage.removeItem('username');
  window.localStorage.removeItem('userId');
});

socket.on('display-stats', (gameData) => {
  console.log('Displaying stats');
  showStats(gameData);
});

function showStats(gameData) {
  const displayText = document.getElementById('display-text');
  displayText.innerHTML = '';

  // hide the canvas
  document.getElementById('current-canvas-container').classList.add('hidden');
  document.getElementById('sentence-input').classList.add('hidden');
  document.getElementById('submit-text').classList.add('hidden');
  document.getElementById('submit-drawing').classList.add('hidden');
  console.log('inside', gameData);
  // iterate through the gameData array and display the content of each entry in a list within display-text
  gameData.forEach((entry) => {
    const li = document.createElement('li');
    console.log(entry);
    if (entry.type === 'sentence') {
      // if the entry is text
      li.appendChild(
        document.createTextNode(`${entry.username} wrote: ${entry.content}`)
      );
    } else if (entry.type === 'image') {
      // if the entry is image
      const img = document.createElement('img');
      //remove http://localhost:3000 from the image url
      entry.content = entry.content.replace('http://localhost:${PORT}', '');
      img.src = entry.content;
      li.appendChild(img);
    }
    displayText.appendChild(li);
  });
}

// socket.on('endTurn', (player) => {
//   if (player.username === username) {
//     enableSentenceInput();
//   }
// });

// function to turn input field with id sentence-input class from hidden to visible
function enableSentenceInput() {
  document.getElementById('sentence-input').classList.remove('hidden');
  document.getElementById('current-canvas-container').classList.add('hidden');
  document.getElementById('submit-text').classList.remove('hidden');
  document.getElementById('submit-drawing').classList.add('hidden');
  document.getElementById('display-text').classList.add('hidden');
  // document.getElementById('text-blocks').classList.remove('hidden');
  // document.getElementById('canvas-container').classList.add('hidden');
}

function enableText(username, turnType) {
  document.getElementById('display-text').classList.remove('hidden');
  document.getElementById('display-text').innerHTML = `${username} is ${
    turnType == 'sentence' ? 'writing' : 'drawing'
  }`;
  document.getElementById('sentence-input').classList.add('hidden');
  document.getElementById('current-canvas-container').classList.add('hidden');
  document.getElementById('submit-text').classList.add('hidden');
  document.getElementById('submit-drawing').classList.add('hidden');
  // document.getElementById('text-blocks').classList.add('hidden');
  // document.getElementById('canvas-container').classList.add('hidden');
}

// function to turn input field with id sentence-input class from visible to hidden
function disableSentenceInput() {
  // document.getElementById('text-blocks').classList.add('hidden');
  document
    .getElementById('current-canvas-container')
    .classList.remove('hidden');
  document.getElementById('submit-text').classList.add('hidden');
  document.getElementById('submit-drawing').classList.remove('hidden');
  document.getElementById('display-text').classList.add('hidden');
}

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

//function to clear the canvas
function clearCanvas() {
  currentContext.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
}
// add onclick event to convert canvas to image
document
  .getElementById('submit-drawing')
  .addEventListener('click', async () => {
    const image = currentCanvas.toDataURL('image/png');
    const response = await fetch('/uploadImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData: image }),
    });
    if (response.status === 200) {
      socket.emit('image');
      clearCanvas();
    }
  });

// Get the submit button element
const submitButton = document.getElementById('submit-text');

// Add event listener to the submit button
submitButton.addEventListener('click', async () => {
  // Get the input element
  const inputElement = document.getElementById('sentence-input');

  // Get the text from the input field
  const desc = inputElement.value;

  // Define the data to be sent to the server
  const data = {
    desc,
  };
  await fetch('/gameDescription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  socket.emit('sentence', desc, username);
  document.getElementById('sentence-input').value = '';
});
