const ge = (n) => document.getElementById(n);
const hide = (e) => e.style.display = 'none';
const reveal = (e, d) => e.style.display = d || 'inherit';
const del = (e) => e && e.parentElement && e.parentElement.removeChild(e);
const child = (e, n) => e.children[n];
const clear = (screen) => { screen.innerHTML = ''; };
const add = (screen, e) => { screen.appendChild(e); return e; };
const swap = (a, b) => { a.parentElement.replaceChild(b, a); return b; };
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
  const p = await getjson(`/getplace/${id}`);
  return new Place({
    trails: p.trails.map(t => new Trail(t)),
  });
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

const centered = (c) => {
  const e = document.createElement('div');
  e.className = 'centered';
  add(e, c);
  return e;
};

const img = (url) => {
  const e = document.createElement('img');
  e.src = url;
  return e;
};
