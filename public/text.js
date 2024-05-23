// Get the submit button element
const submitButton = document.getElementById('submit-button');

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
  const response = await fetch('/gameDescription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
});
