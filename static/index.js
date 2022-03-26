window.onload = async () => {
  const map = L.map('map').setView([39.002, -108.666], 7);
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
  }).addTo(map);

  const plotTrails = (l) => {
    for (const p of l) {
      const coords = p.geometry.coordinates;
      const thPolyline = L.polyline(coords, {color: 'red'});
      thPolyline.addTo(map);
    }
  }

  const plotAround = async (a) => {
    const nearby = await getTrailsAround(a[0], a[1], 0.3);
    plotTrails(nearby.trails);
  };
  plotAround([39.071445, -108.549728]);
};
