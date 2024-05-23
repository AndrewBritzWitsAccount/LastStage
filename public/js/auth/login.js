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
    console.log('res', response.body);
    if (response.status === 200) {
      console.log(response);
      // add username to local storage
      localStorage.setItem('username', username);
      localStorage.setItem('userId', response.userId);
      window.location.href = '/lobby';
    } else {
      console.log('Login failed');
    }

    document.getElementById('login-form').reset();
  });
