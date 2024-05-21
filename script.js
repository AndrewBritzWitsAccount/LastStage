// script.js

// Function to fetch current game state from server and update UI
async function updateUI() {
    const response = await fetch('/gamestate');
    const gameState = await response.json();

    // Update UI with current game state
    document.getElementById('round').innerText = `Round: ${gameState.round}`;
    document.getElementById('phrase').innerText = `Phrase: ${gameState.phrase}`;
    document.getElementById('drawing').innerText = `Drawing: ${gameState.drawing}`;
}

// Function to handle form submission
document.getElementById('input-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('input').value;

    // Send player input to server
    await fetch('/input', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
    });

    // Clear input field
    document.getElementById('input').value = '';

    // Update UI with current game state
    updateUI();
});

// Initial UI update
updateUI();
