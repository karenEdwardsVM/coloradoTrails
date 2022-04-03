const ge = (n) => document.getElementById(n);
const hide = (e) => e.style.display = 'none';
const reveal = (e, d) => e.style.display = d || 'inherit';
const del = (e) => e && e.parentElement && e.parentElement.removeChild(e);
const child = (e, n) => e.children[n];
const distance = (x, y, x1, y1) => {
  return Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2));
};

const getjson = async (u) => {
  return (await (await window.fetch(u)).json());
};

const getTrailsAround = async (lat, lon, rad) => {
  return (await getjson(`/getaround/${lat}/${lon}/${rad}`));
};

const getPlace = async (id) => {
  return (await getjson(`/getplace/${id}`));
};

const queryParam = (s) => {
  if (!window.location.search) { return null; }

  const t = window.location.search.split('?');
  const ps = t[t.length - 1]
               .split('&')
               .map(s => s.split('='));

  for (const p of ps) {
    if (p[0] == s) { return p[1]; }
  }

  return null;
};

class Map {
  constructor(L, lat, lon) {
    this.L = L;
    this.map = L.map('map').setView([lat, lon], 7);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: ['a','b','c']
    }).addTo(this.map);
  }

  plotTrails(l, c, w, o) {
    for (const p of l) {
      const coords = p.trail.geometry.coordinates;
      const thPolyline = this.L.polyline(coords);
      thPolyline.setStyle({color: c, weight: w, opacity: o});
      thPolyline.addTo(this.map);
    }
  }

  plotMarker(lat, lon) {
    const m = new L.marker([lat, lon]);
    m.addTo(this.map);
  }

  async plotAround(lat, lon, rad = 0.3) {
    const nearby = await getTrailsAround(lat, lon, rad);
    //console.log(nearby);
    this.plotTrails(nearby.trails, 'red', 2);
  }

  async fitBounds(left, top, right, bottom) {
    this.map.fitBounds([
      [top, left],
      [bottom, right],
    ]);
  }
}
