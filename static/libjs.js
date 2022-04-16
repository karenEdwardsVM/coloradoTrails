const genid = () => [1,2].map(i => Math.random()).join().replace(/0|\.|,/g,'');
const ge = (n) => document.getElementById(n);
const hide = (e) => e.style.display = 'none';
const reveal = (e, d) => e.style.display = d || 'inherit';
const del = (e) => e && e.parentElement && e.parentElement.removeChild(e);
const child = (e, n) => e.children[n];
const clear = (screen) => { screen.innerHTML = ''; };
const add = (screen, e) => { screen.appendChild(e); return e; };
const swap = (a, b) => { a.parentElement.replaceChild(b, a); return b; };
const plural = (n, s) => n == 1 ? s : s + "s";
const after = async (t, f) => {
  if (f) { window.setTimeout(f, t); } else { return new Promise(resolve => after(t, resolve)); }
};
const distance = (x, y, x1, y1) => {
  return Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2));
};

const getjson = async (u) => {
  return (await (await window.fetch(u)).json());
};

const debounce = (f, t) => {
  let lastcall = 0, lastvalue = null;
  const w = async (...args) => {
    lastcall = Math.max(Date.now(), lastcall);
    await after(t + 150);
    if ((Date.now() - lastcall) > t) {
      await after(25);
      lastvalue = await f(...args);
    }
    return lastvalue;
  };
  return w;
};

const getTrailsAround = async (lat, lon, rad) => {
  return (await getjson(`/getaround/${lat}/${lon}/${rad}`));
};

const getTrailsInSearch = async (query, lat, lon, rad) => {
  return (await getjson(`/searcharound/${lat}/${lon}/${rad}`));
};

const getPlace = async (id) => {
  const p = await getjson(`/getplace/${id}`);
  if (p.trails !== null) {
    return new Place({
      trails: p.trails.map(t => new Trail(t)),
    });
  } else {
    return null;
  }
};

const addquery = (s, q) => {
  return s.match('([^?]*)?.*')[1] + '?' +
    Object.keys(q).map(k => `${k}=${q[k]}`).join('&');
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

// write search function here

class Map {
  constructor(L, lat, lon, id = 'map', zoom = 7, opts = {}) {
    this.L = L;
    this.map = L.map(id, opts);
    this.map.setView([lat, lon], zoom);
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

const centered = (cs) => {
  const e = document.createElement('div');
  e.className = 'centered';
  for (const c of cs) { add(e, c); }
  return e;
};

const img = (url) => {
  const e = document.createElement('img');
  e.src = url;
  return e;
};

const padder = (p, cs = []) => {
  const e = document.createElement('div');
  e.style.padding = p;
  for (const c of cs) { add(e, c); }
  return e;
};

const inputBox = (label, value, o = {}) => {
  const e = document.createElement('input');
  e.setAttribute('type', 'checkbox');
  if (o.oncheck) { e.onchange = o.oncheck; }
  return e;
};

const messageBox = (value) => {
  const e = document.createElement('div');
  e.innerText = value;
  return e;
};
