window.onload = () => {
  const map = L.map('map').setView([39.002, -108.666], 7);
  //const mapEl = document.getElementById('map');
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
  }).addTo(map);
}
