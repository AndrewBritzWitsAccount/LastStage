document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (response.status === 200) {
        localStorage.setItem('username', username);
        window.location.href = '/views/lobby.html';
    } else {
        alert(result.error);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;

    const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword })
    });

    const result = await response.json();
    if (response.status === 200) {
        alert('Registration successful. You can now login.');
        showLoginForm();
    } else {
        alert(result.error);
    }
});

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.style.display = 'none';

    const registerForm = document.getElementById('registerForm');
    registerForm.style.display = 'block';
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.style.display = 'block';

    const registerForm = document.getElementById('registerForm');
    registerForm.style.display = 'none';
}

document.getElementById('loginButton').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (response.status === 200) {
        window.location.href = '/views/lobby.html';
    } else {
        alert(result.error);
    }
});

document.getElementById('registerButton').addEventListener('click', async () => {
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;

    const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword })
    });

    const result = await response.json();
    if (response.status === 200) {
        alert('Registration successful. You can now login.');
        showLoginForm();
    } else {
        alert(result.error);
    }
});
