document.getElementById('imageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const imageUrl = document.getElementById('imageUrl').value;
  
    const response = await fetch('/game/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, imageUrl })
    });
  
    const result = await response.json();
    if (response.status === 201) {
      alert(result.message);
      loadImages();
    } else {
      alert(result.error);
    }
  });
  
  async function loadImages() {
    const response = await fetch('/game/images');
    const images = await response.json();
    const imagesList = document.getElementById('imagesList');
    imagesList.innerHTML = '';
  
    images.forEach(image => {
      const imageItem = document.createElement('div');
      imageItem.innerHTML = `<p>${image.username}: ${image.description}</p><img src="${image.image_url}" alt="${image.description}">`;
      imagesList.appendChild(imageItem);
    });
  }
  
  document.addEventListener('DOMContentLoaded', loadImages);
  