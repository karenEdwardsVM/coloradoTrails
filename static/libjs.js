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
const toprec = (i, p) => Math.floor(i * Math.pow(10, p)) / Math.pow(10, p);
const after = async (t, f) => {
  if (f) { window.setTimeout(f, t); } else { return new Promise(resolve => after(t, resolve)); }
};

const distance = (x, y, x1, y1) => {
  return Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2));
};
const toLat = (mi) => mi / 69.8;
const toMi = (lat) => lat * 69.8;

const getjson = async (u) => {
  return (await (await window.fetch(u)).json());
};

const postjson = async (u, data) => {
  return (await (await window.fetch(u, {method: 'POST', body: data, headers: {'Content-Type': 'application/json'}})).json());
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
  return (await getjson(addquery(`/searcharound/${lat}/${lon}/${rad}`, query)));
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
    return m;
  }

  async plotAround(lat, lon, rad = 0.3) {
    const nearby = await getTrailsAround(lat, lon, rad);
    this.plotTrails(nearby.trails, 'red', 2);
  }

  async fitBounds(left, top, right, bottom) {
    this.map.fitBounds([
      [top, left],
      [bottom, right],
    ]);
  }
}

const dca = t => document.createElement(t);
const ext = async (pe1, ce1) => {
  if (!pe1 || !ce1) {
    // console.log('Rendering error, cannot extend', pe1, ' by ', ce1);
  }
  else if (typeof(ce1) == 'string') { pe1.innerHTML += ce1; }
  else if (ce1 instanceof Promise || ce1.constructor.name == 'AsyncFunction') { pe1.appendChild(await ce1); }
  else if (ce1) { pe1.appendChild(ce1); }
};

const centered = (cs) => {
  const e = dca('div');
  e.className = 'centered';
  for (const c of cs) { ext(e, c); }
  return e;
};

const img = (url) => {
  const e = dca('img'); e.src = url; return e;
};

const padder = (p, cs = []) => {
  const e = dca('div');
  e.style.padding = p;
  for (const c of cs) { ext(e, c); }
  return e;
};

const inputBox = (label, value, o = {}) => {
  const e = dca('input');
  e.setAttribute('type', 'checkbox');
  if (o.oncheck) { e.onchange = o.oncheck; }
  return e;
};

const messageBox = (value, boxed = false) => {
  const e = boxed ? padder('var(--npad)') : dca('div');
  ext(e, value);
  if (boxed) { e.className = 'boxed'; }
  return e;
};

const button = (label, onclick) => {
  const b = messageBox(centered([label]), true);
  b.style.cursor = 'pointer'; b.style.touchAction = 'none';
  b.style.textAlign = 'center';
  b.style.borderRadius = '4px';
  b.onclick = onclick;
  b.onmouseenter = hovstart;
  b.onmouseleave = hovend;
  return b;
};

const imageUpload = (label, onupload) => {
  const cap = dca('input');
  cap.setAttribute('type', 'file');
  cap.setAttribute('capture', 'environment');
  cap.setAttribute('accept', 'image/*');
  cap.style.display = 'none';
  cap.addEventListener('change', () => {
    for (const f of cap.files) {
      const reader = new FileReader();
      reader.onload = (e) => { onupload(e); };
      reader.readAsBinaryString(f);
    }
  });
  const b = button(centered([label, cap]), () => { cap.click(); });
  return b;
};

const dims = (e) => e.getBoundingClientRect();
const rng = (b, e) => {const o = []; for (let i = b; i <= e; i++) { o.push(i); }; return o;};
const stopevent = (e) => e.preventDefault();
const sa = (e, k, v) => e.setAttribute(k, v);
const rendered = (e) => document.body.contains(e);
const hovstart = (e, recur) => {
  if (!recur) { e.target.classList.add('hover'); }
  window.setTimeout(() => {
    if (!rendered(e.target)) {hovend(e);}
    else { hovstart(e, true); }
  }, 500);
};
const hovend = (e) => e.target.classList.remove('hover');
const rolabel = (name, from, to, init, msg, unit) => { return (((from && to)) ? ((() => {const el1 = dca('div');(() => {ext(el1, name.concat(': (from ', from, (unit || ''), ' to ', to, (unit || ''), '), ', (msg || 'currently: '), init, (unit || '')));})(); return el1;})()) : ((() => {const el1 = dca('div');(() => {ext(el1, name.concat(' ', (msg || 'currently: '), init, (unit || '')));})(); return el1;})()));};
const rangeoption = (so, name, from, to, init, os, niso) => { return (() => {let mklabel = (v) => ((() => {return ((os.minimal) ? ((() => {return rolabel((os.desc || name), null, null, v, os.msg, os.unit)})()) : ((() => {return rolabel((os.desc || name), from, to, v, os.msg, os.unit)})()))})()); let label = mklabel(init); let slider = rangeinput((v) => ((() => {so(name, Math.round(v)); return label = swap(label, mklabel(Math.round(v)))})()), from, to, init); let body = (() => {const el1 = dca('div'); sa(el1, 'class', 'option'); (() => {ext(el1, label);})(); (() => {ext(el1, slider);})(); return el1;})(); os = (os || {}); ((os.disabled) ? ((() => {return slider.disabled = true})()) : (false)); body.slideto = async (n) => ((await (async () => {let st = 0; let init = slider.value; while ((st <= 30)) {(await (async () => {await after(50); slider.value = (init + (((n - init) / 30) * st)); label = swap(label, mklabel(slider.value)); ((niso) ? ((await (async () => {return niso(name, slider.value)})())) : (false)); return st = (st + 1)})())}; return false})())); return body})();};
const choiceoption = (so, name, options, selected, params) => { return (() => {let m = (() => {return (() => {let parentid = genid(); return (() => {const el1 = dca('div'); el1['id'] = parentid; (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'class', 'option'); (() => {ext(el1, ((name) ? ((((name[(name.length - 1)] == '?')) ? ((() => {const el1 = dca('div');(() => {ext(el1, name);})(); return el1;})()) : ((() => {const el1 = dca('div');(() => {ext(el1, name.concat(': '));})(); return el1;})()))) : ((() => {const el1 = dca('div');return el1;})())));})(); (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'class', 'horizontal'.concat((((options.length < 5)) ? (' choicerow spaced ') : (' choicerow ')))); options.forEach((o) => { el1.appendChild((() => {const el1 = dca('div'); el1['onclick'] = async (ev) => ((await (async () => {ev.preventDefault(); return ((await so(name, o)) ? ((await (async () => {return swap(ge(parentid), choiceoption(so, name, options, o, params))})())) : (false))})())); sa(el1, 'onmouseleave', 'hovend(event);'); sa(el1, 'class', (((o == selected)) ? (' choicebutton button selected ') : (' choicebutton button '))); sa(el1, 'style', 'cursor: pointer; touch-action: none;'); sa(el1, 'onmouseenter', 'hovstart(event);'); (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'class', ' boxed'); sa(el1, 'style', 'padding: var(--npad) var(--npad);'.concat('height: inherit;')); (() => {ext(el1, o);})(); return el1;})());})(); return el1;})()); });return el1;})());})(); return el1;})());})(); return el1;})()})()})(); (((params && params.expand)) ? ((() => {return m.style.width = '100%'})()) : (false)); return m})();};
const submitoption = (message, onclick, id) => { return (() => {const el1 = dca('div'); el1['onclick'] = onclick; sa(el1, 'onmouseleave', 'hovend(event);'); sa(el1, 'class', 'bigbutton button'); sa(el1, 'style', 'cursor: pointer; touch-action: none;'); sa(el1, 'onmouseenter', 'hovstart(event);'); el1['id'] = (id || 'submitoption'); (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'class', ' boxed'); sa(el1, 'style', 'padding: var(--npad) var(--npad);'.concat('height: inherit;')); (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'class', 'centered'); el1['id'] = (id || 'submitoption').concat('-msg'); (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'style', ''); (() => {ext(el1, message);})(); return el1;})());})(); return el1;})());})(); return el1;})());})(); return el1;})();};
const rangeinput = (so, from, to, init) => { return (() => {let range = (to - from); let disabled = false; let value = init; let dragging = false; let thumb = (() => {const el1 = dca('div'); sa(el1, 'class', 'inputthumb'); return el1;})(); let inp = (() => {const el1 = dca('div'); sa(el1, 'class', 'inputrangewrapper'); (() => {ext(el1, (() => {const el1 = dca('div'); sa(el1, 'class', 'inputrange'); (() => {ext(el1, thumb);})(); return el1;})());})(); return el1;})(); let movethumb = (v) => ((() => {let offset = (((v - from) / range) * 100); return thumb.style.left = ('calc(' + String(offset) + '%)')})()); let moverange = (px) => ((() => {let progress = Math.min(Math.max(0, ((px - dims(inp).left) / dims(inp).width)), 1); return inp.value = (from + (progress * range))})()); Object.defineProperty(inp, 'disabled', {'get': () => ((() => {return disabled})()),'set': (v) => ((() => {return disabled = v})())}); Object.defineProperty(inp, 'value', {'get': () => ((() => {return value})()),'set': (v) => ((() => {value = Math.round(v); so(value); return movethumb(value)})())}); inp.onmousedown = (e) => ((() => {return ((!(disabled)) ? ((() => {dragging = true; moverange(e.pageX); let onupevt = null; let moveevt = window.addEventListener('mousemove', (e) => ((() => {return ((dragging) ? ((() => {return moverange(e.pageX)})()) : (false))})())); return onupevt = window.addEventListener('mouseup', (e) => ((() => {dragging = false; window.removeEventListener('mouseup', onupevt); return window.removeEventListener('mousemove', moveevt)})()))})()) : (false))})()); inp.ontouchend = (e) => ((() => {return dragging = false})()); inp.ontouchstart = (e) => ((() => {e.preventDefault(); return ((!(disabled)) ? ((() => {dragging = true; return moverange(e.changedTouches[0].pageX)})()) : (false))})()); inp.ontouchmove = (e) => ((() => {return (((dragging && !(disabled))) ? ((() => {e.preventDefault(); return moverange(e.changedTouches[0].pageX)})()) : (false))})()); movethumb(value); return inp})();};
