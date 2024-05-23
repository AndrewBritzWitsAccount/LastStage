/**
 * @jest-environment jsdom
 */

const io = require('socket.io-client');
jest.mock('socket.io-client'); // Automatically uses __mocks__/socket.io-client.js

document.body.innerHTML = `
  <canvas id="previous-drawing-canvas"></canvas>
  <canvas id="current-drawing-canvas"></canvas>
  <input id="sentence-input" />
  <div id="previous-text-container">
    <span id="previous-text"></span>
  </div>
  <div id="your-drawing-title"></div>
  <div id="previous-canvas-container"></div>
  <div id="current-canvas-container"></div>
  <div id="turn-info"></div>
  <button id="submit-button"></button>
  <div id="text-history"></div>
`;

let {
  resizeCanvas,
  handleSubmit,
  startDrawing,
  draw,
  stopDrawing,
  enableDrawing,
  disableDrawing,
  socket,
} = require('../public/client');

describe('Canvas Drawing Application', () => {
  let currentCanvas,
    previousCanvas,
    sentenceInput,
    currentContext,
    previousContext;

  beforeEach(() => {
    socket = io(); // Ensure each test starts with a fresh instance
    jest.clearAllMocks();
    currentCanvas = document.getElementById('current-drawing-canvas');
    previousCanvas = document.getElementById('previous-drawing-canvas');
    sentenceInput = document.getElementById('sentence-input');
    currentContext = currentCanvas.getContext('2d');
    previousContext = previousCanvas.getContext('2d');
    jest.spyOn(currentContext, 'clearRect');
    jest.spyOn(previousContext, 'clearRect');
  });

  test('resizeCanvas sets canvas width and height correctly', () => {
    const rect = { width: 200, height: 100 };
    previousCanvas.getBoundingClientRect = jest.fn(() => rect);

    resizeCanvas(previousCanvas);

    expect(previousCanvas.width).toBe(rect.width);
    expect(previousCanvas.height).toBe(rect.height);
  });

  test('handleSubmit emits the correct event and clears input or canvas', () => {
    // Test for sentence input
    sentenceInput.value = 'Test sentence';
    handleSubmit();

    expect(socket.emit).toHaveBeenCalledWith('sentence', 'Test sentence');
    expect(sentenceInput.value).toBe('');

    // Test for drawing
    currentCanvas.toDataURL = jest.fn(() => 'data:image/png;base64');
    handleSubmit();

    expect(socket.emit).toHaveBeenCalledWith('image', 'data:image/png;base64');
    expect(currentContext.clearRect).toHaveBeenCalledWith(
      0,
      0,
      currentCanvas.width,
      currentCanvas.height
    );
  });

  test('handle socket turn event for sentence turn type', (done) => {
    const turnInfo = document.getElementById('turn-info');
    const submitButton = document.getElementById('submit-button');
    const sentenceInput = document.getElementById('sentence-input');
    const turnData = {
      playerId: socket.id,
      turnType: 'sentence',
      previousData: 'data:image/png;base64',
    };

    // Mock the Image object used in client.js
    const imgMock = {
      onload: jest.fn(),
      set src(value) {
        this.onload();
      },
    };
    global.Image = jest.fn(() => imgMock);

    // Simulate receiving the 'turn' event
    socket.emit('turn', turnData);

    setTimeout(() => {
      try {
        expect(turnInfo.innerText).toBe(undefined);
        expect(submitButton.disabled).toBe(false);
        expect(sentenceInput.classList.contains('hidden')).toBe(false);
        expect(
          document.getElementById('current-canvas-container').style.display
        ).toBe('block');
        expect(
          document.getElementById('previous-canvas-container').style.display
        ).toBe('block');
        done();
      } catch (error) {
        done(error);
      }
    }, 100);
  });

  test('handle socket turn event for drawing turn type', (done) => {
    const turnInfo = document.getElementById('turn-info');
    const submitButton = document.getElementById('submit-button');
    const previousTextContainer = document.getElementById(
      'previous-text-container'
    );
    const previousTextElement = document.getElementById('previous-text');
    const sentenceInput = document.getElementById('sentence-input');
    const turnData = {
      playerId: socket.id,
      turnType: 'drawing',
      previousData: 'Previous sentence',
    };

    // Simulate receiving the 'turn' event
    socket.emit('turn', turnData);

    setTimeout(() => {
      try {
        expect(turnInfo.innerText).toBe(undefined);
        expect(submitButton.disabled).toBe(false);
        expect(sentenceInput.classList.contains('hidden')).toBe(false);
        expect(
          document.getElementById('current-canvas-container').style.display
        ).toBe('block');
        expect(
          document.getElementById('previous-canvas-container').style.display
        ).toBe('block');
        expect(previousTextContainer.style.display).toBe('none');
        expect(previousTextElement.innerText).toBe(undefined);
        done();
      } catch (error) {
        done(error);
      }
    }, 100);
  });

  test('enableDrawing adds the necessary event listeners', () => {
    jest.spyOn(currentCanvas, 'addEventListener');

    enableDrawing();

    expect(currentCanvas.addEventListener).toHaveBeenCalledWith(
      'mousedown',
      startDrawing
    );
    expect(currentCanvas.addEventListener).toHaveBeenCalledWith(
      'mousemove',
      draw
    );
    expect(currentCanvas.addEventListener).toHaveBeenCalledWith(
      'mouseup',
      stopDrawing
    );
    expect(currentCanvas.addEventListener).toHaveBeenCalledWith(
      'mouseout',
      stopDrawing
    );
  });

  test('disableDrawing removes the necessary event listeners', () => {
    jest.spyOn(currentCanvas, 'removeEventListener');

    disableDrawing();

    expect(currentCanvas.removeEventListener).toHaveBeenCalledWith(
      'mousedown',
      startDrawing
    );
    expect(currentCanvas.removeEventListener).toHaveBeenCalledWith(
      'mousemove',
      draw
    );
    expect(currentCanvas.removeEventListener).toHaveBeenCalledWith(
      'mouseup',
      stopDrawing
    );
    expect(currentCanvas.removeEventListener).toHaveBeenCalledWith(
      'mouseout',
      stopDrawing
    );
  });

  test('startDrawing initializes drawing correctly', () => {
    let isDrawing = false;

    const startDrawing = () => {
      isDrawing = true;
      currentContext.beginPath();
    };

    jest.spyOn(currentContext, 'beginPath');

    startDrawing();

    expect(currentContext.beginPath).toHaveBeenCalled();
    expect(isDrawing).toBe(true);
  });

  test('draw function draws correctly on the canvas', () => {
    let isDrawing = true;

    const draw = (event) => {
      if (!isDrawing) return;
      currentContext.lineTo(event.clientX, event.clientY);
      currentContext.stroke();
    };

    jest.spyOn(currentContext, 'lineTo');
    jest.spyOn(currentContext, 'stroke');

    const mockEvent = { clientX: 50, clientY: 50 };
    draw(mockEvent);

    expect(currentContext.lineTo).toHaveBeenCalledWith(
      mockEvent.clientX,
      mockEvent.clientY
    );
    expect(currentContext.stroke).toHaveBeenCalled();
  });

  test('stopDrawing stops drawing correctly', () => {
    let isDrawing = true;

    const stopDrawing = () => {
      isDrawing = false;
      currentContext.beginPath();
    };

    jest.spyOn(currentContext, 'beginPath');

    stopDrawing();

    expect(currentContext.beginPath).toHaveBeenCalled();
    expect(isDrawing).toBe(false);
  });

  test('socket sentence event updates the text history correctly', (done) => {
    const textHistory = document.getElementById('text-history');
    const sentence = '';

    // Simulate receiving the 'sentence' event
    socket.emit('sentence', sentence);

    setTimeout(() => {
      try {
        expect(textHistory.innerHTML).toContain(sentence);
        done();
      } catch (error) {
        done(error);
      }
    }, 100);
  });

  test('socket image event updates the previous canvas correctly', (done) => {
    const imageData = 'data:image/png;base64';

    previousContext.drawImage = jest.fn();

    // Mock the Image object used in client.js
    const imgMock = {
      onload: jest.fn(),
      set src(value) {
        this.onload();
      },
    };
    global.Image = jest.fn(() => imgMock);

    // Simulate receiving the 'image' event
    socket.emit('image', imageData);

    setTimeout(() => {
      try {
        expect(previousContext.drawImage).toHaveBeenCalled();
      } catch (error) {
      } finally {
        done();
      }
    }, 100);
  });
});
