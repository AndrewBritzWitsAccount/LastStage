document
  .getElementById('login-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    console.log(response);
    if (response.status === 200) {
      // add username to local storage
      localStorage.setItem('username', username);
      console.log(response);
      window.location.href = '/lobby';
    } else {
      console.log('Login failed');
    }

    document.getElementById('login-form').reset();
  });