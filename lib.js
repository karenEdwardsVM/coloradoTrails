const fs = require('fs'),
      https = require('https'),
      csv = require('./convertCSV.js');

class OrderedHeap {
  constructor(maxlen = 1) {
    this.maxlen = maxlen; this.data = [];
  }

  bs(l, r, v) {
    const i = Math.floor((r + l) / 2);
    if ((r - l) < 1 || !this.data[i]) { return i; }
    if (this.data[i].v < v) { return this.bs(i + 1, r, v); }
    if (this.data[i].v > v) { return this.bs(l, i, v); }
    return i;
  }

  push(d, v) {
    const i = this.bs(0, this.data.length, v);
    if (i < this.maxlen) {
      this.data.splice(i, 0, {d, v});
    }
  }

  take(k) {
    const out = [];
    for (let i = 0; i < k && i < this.data.length; i++) {
      out.push(this.data[i].d);
    }
    return out;
  }
}


const omap = (o, f) => { const ot = {}; for (const k of Object.keys(o)) { ot[k] = f(k, o[k]); } return ot; };
const subdir = (p) => { try { fs.mkdirSync(p); } catch (e) { } };

const jw = e => JSON.stringify(e);
const jr = s => JSON.parse(s);

const almost = (a, b, spread = 0.1) => { return (a > b - spread) && (a < b + spread); };
const after = async (t, f) => {
  if (f) { setTimeout(f, t); } else { return new Promise(resolve => after(t, resolve)); }
};

const loadjson = (path, opts) => {
  try {
    return opts && opts.plain ?
      JSON.parse(String(fs.readFileSync(path))) :
      jr(String(fs.readFileSync(path)));
  } catch (e) { return null; }
};

const writejson = (path, v, opts) => {
  if (!opts) { opts = {}; }
  if (opts.append) {
    fs.writeFileSync(path, (opts.plain ? JSON.stringify(v) : jw(v)) + '\n', {flag: 'a+'});
  } else {
    fs.writeFileSync(path, (opts.plain ? JSON.stringify(v) : jw(v)));
  }
};

const loadchunkedjson = (path, opts) => {
  try { 
    const data = String(fs.readFileSync(path));
    return data.split('\n')
               .filter(line => line && line != '')
               .map(line => opts && opts.plain ? JSON.parse(line) : jr(line));
  } catch (e) { return null; }
};

const log = (...a) => {
  const t = Date.now();
  console.log('Log:', t, ...a);
  fs.writeFileSync('./data/log.txt', t.toString() + a.map(e => jw(e)).join('\t') + '\n', {flag: 'a+'});
};

const pickelt = (a) => a.length > 0 ? a[Math.floor(Math.random() * a.length)] : null;

const fe = (a, i) => a.length - (1 + i);
const isError = (e) => (e instanceof Error || (e && e.err));

const get = async (url) => {
  return new Promise((res) => {
    try {
      let out = '';
      const req = 
        https.get(url, r => {
          r.on('error', (e) => { log('Request', url, 'failed', e); res(null); })
           .on('data', (d) => { out += d; })
           .on('end', () => {
             res({headers: r.headers, body: out, code: r.statusCode});
           });
        });
      req.end();
    } catch (e) {
      log('Node HTTP lib broke.', e);
      return res(null);
    }
  });
};

function loadObservations() {
  const obs2022 = csv.toJSON('inat/observations-2022.csv');
  const obs2021 = csv.toJSON('inat/observations-2021.csv');
  return [].concat(obs2021);
}

const Trail = require('./static/trail.js').Trail;

let trails = loadjson('./static/trails.json');
trails = {
  ...trails,
  features: trails.features.filter(f => f.geometry),
};
//console.log(trails.features);
const observations = loadObservations();
const obsCoords = observations.map((e, i) => [Number(e.latitude), Number(e.longitude), i]); // array of [lat, long] arrays
const sortedObs = obsCoords.sort((a, b) => a[0] - b[0]);

const fml = (cs) => {
  return [cs[0], cs[Math.floor(cs.length / 2)], cs[cs.length - 1]];
};

const distance = (x, y, x1, y1) => {
  return Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2));
};

const timeit = (f) => {
  const now = Date.now();
  f();
  return Date.now() - now;
};

// trail is a list of all the coordinates in the trail
const observationsAround = (trail, rad) => {
  let res = [];
  try {
    const bound = trail.bounds;
    const cutObs = sortedObs.filter(e => ((e[0] >= bound.bottom - 1) && (e[0] <= bound.top + 1)));
    //const cutObs = sortedObs;
    const coords = trail.geometry;
    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < cutObs.length; j++) {
        if (distance(coords[i][0], coords[i][1], cutObs[j][0], cutObs[j][1]) <= rad) {
          res.push(cutObs[j][2]);
        }
      }
    }
  } catch (e) {
    console.log('Observations around:', trail, 'failed', e);
  }
  return Array.from(new Set(res)).map(e => observations[e]);
};

const trailFromID = (id, withobservations = false) => {
  const trail = new Trail({trail: trails.features[id]});
  if (withobservations) {
    trail.observations = observationsAround(trail, 0.02);
  }
  return trail;
};

const trailsAround = (lat, lon, rad) => {
  const out = [];
  for (let i = 0; i < trails.features.length; i++) {
    const t = trailFromID(i);
    if (t && t.geometry && t.geometry.length > 0) {
      let ok = false;
      // we can look at any coordinate instead of first, middle, last, if performance allows.
      //   currently most of the time this route takes is in sending the response back.
      for (const c of fml(t.geometry)) {
        if (distance(lat, lon, c[0], c[1]) < rad) {
          ok = true; break;
        }
      }
      if (ok) { out.push(t); }
    }
  }
  return out;
};

const search = (query, lat, lon, rad) => {
  ts = trailsAround(lat, lon, rad);
  let h = new OrderedHeap(50);
  for (const t of ts) {
    tp = t.trail.properties;
    let count = 0;
    for (const k in query) {
      count += (tp[k] == null) ? 0 : ((query[k] == tp[k]) ? -1 : 1)
    }
    h.push(t, count);
  }
  return h.data;
};
//console.log(search({'dogs': 'yes', 'hiking': 'no', 'horse': 'yes', 'bike': 'yes', 'motorcycle': 'no'}, 39.071445, -108.549728, 0.2));

const timetaken = timeit(() => {
  for (let i = 20; i < 100; i++) {
    t = trailFromID(i, true);
    //console.log(t);
    //console.log(t.observations.length);
  }
});
//console.log("time = ", timetaken);

module.exports = {
  omap, subdir, jw, jr, after, loadjson, writejson, loadchunkedjson, log, pickelt, fe, isError, get, almost,
  trails, fml, distance, observationsAround, Trail, trailFromID, OrderedHeap, trailsAround, search,
};
