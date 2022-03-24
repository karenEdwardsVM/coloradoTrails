window.onload = async () => {
  const map = L.map('map').setView([39.002, -108.666], 7);
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
  }).addTo(map);

  const count = (await (await window.fetch('/trailcount')).json()).length;
  const trails = [];
  const plotTrails = async () => {
    for (let i = 0; i < count / 100; i++) { 
      trails.push((await (await window.fetch(`/gettrail/${i}`)).json()));
    }
    parseTrail(trails.map(el => el["geometry"]["coordinates"]));
  };
  plotTrails();

  const dtPoints = desTrails["features"].map(el => el["geometry"]["coordinates"]);
  const parseTrail = (l) => {
    for (const p of l) {
      const thPolyline = L.polyline(p, {color: 'red'});
      thPolyline.addTo(map);
    }
  }
};
