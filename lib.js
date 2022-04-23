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

  take(k, keepscore = false) {
    const out = [];
    for (let i = 0; i < k && i < this.data.length; i++) {
      out.push(keepscore ? this.data[i] : this.data[i].d);
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
  return [].concat(obs2021, obs2022);
}

const {Trail, Place} = require('./static/trail.js');

let trails = loadjson('./inat/trails.json');
trails = {
  ...trails,
  features: trails.features.filter(f => f.geometry && f.properties.name !== null),
};

let byplace = {};
for (const t of trails.features) {
  if (t.properties && t.properties.place_id != null) {
    byplace[t.properties.place_id] =
      byplace[t.properties.place_id] ? byplace[t.properties.place_id].concat([t]) : [t];
  }
}

const getPlace = (id) => { return byplace[id] || []; };

const observations = loadObservations();
const obsCoords = observations.map((e, i) => [Number(e.latitude), Number(e.longitude), i]); // array of [lat, long] arrays
const sortedObs = obsCoords.sort((a, b) => a[0] - b[0]);

const og = {};
const o_radius = 0.01;
const o_increment = o_radius;
const to_o_place = (lat, lon) => {
  return {
    lat: Math.floor((lat + 130) / o_increment),
    lon: Math.floor((lon + 130) / o_increment),
  };
};
for (const o of obsCoords) {
  const {lat, lon} = to_o_place(o[0], o[1]);
  if (!og[lat]) { og[lat] = {}; }
  if (og[lat][lon]) {
    og[lat][lon].push(o);
  } else {
    og[lat][lon] = [o]; // o[2];
  }
}
const getObsBucket = (lat, lon) => {
  return ((og[lat] || {})[lon]) || [];
};
const observationsNear = (lata, lona) => {
  const {lat, lon} = to_o_place(lata, lona);
  return Array.from(new Set([].concat(
    getObsBucket(lat - 1, lon),
    getObsBucket(lat, lon),
    getObsBucket(lat + 1, lon),

    getObsBucket(lat - 1, lon - 1),
    getObsBucket(lat + 1, lon - 1),
    getObsBucket(lat, lon - 1),

    getObsBucket(lat - 1, lon + 1),
    getObsBucket(lat + 1, lon + 1),
    getObsBucket(lat, lon + 1),
  )));
};

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

const observationsAround = (trail, rad = o_radius) => {
  let res = [];
  try {
    const bound = trail.bounds;
    //const cutObs = sortedObs;
    //const cutObs = sortedObs.filter(e => ((e[0] >= bound.bottom - 0.01) && (e[0] <= bound.top + 0.01)));
    const coords = trail.geometry;
    let cutObs = new Set();
    for (const c of coords) {
      for (const o of observationsNear(c[0], c[1])) {
        cutObs.add(o);
      }
    }
    cutObs = Array.from(cutObs);

    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < cutObs.length; j++) {
        if (coords[i] && cutObs[j] && (distance(coords[i][0], coords[i][1], cutObs[j][0], cutObs[j][1]) <= rad)) {
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
    trail.observations = observationsAround(trail);
  }
  return trail;
};

const placesAround = (lat, lon, rad) => {
  const out = [];
  for (const i in byplace) {
    const plt = getPlace(i);
    for (const tf of plt) {
      const t = new Trail({trail: tf});
      if (t && t.geometry && t.geometry.length > 0) {
        let ok = false;
        for (const c of fml(t.geometry)) {
          if (distance(lat, lon, c[0], c[1]) < rad) { ok = true; break; }
        }
        if (ok) {
          const ts = plt.map(t2 => new Trail({trail: t2}));
          for (const t2 of ts) {
            if (t2.properties.name !== null) { // Are we filtering trails out that we shouldn't be?
              console.log('OA TOOK', timeit(() => {
                t2.observations = observationsAround(t2);
              }), t2.properties.name);
            }
          }
          out.push(new Place({trails: ts}));
          break;
        }
      }
    }
  }
  return out;
};

// length in the trails is length_mi_
// dogs can be yes, no, leashed
// observation count weighing
const search = (query, lat, lon, rad) => {
  const ts = placesAround(lat, lon, rad);
  let h = new OrderedHeap(25);
  for (const t of ts) {
    let range = 0,
        tp = t.properties,
        count = 0;
    for (const k in query) {
      // for every half mile over or under, add 1 to the score
      if (k == 'length_mi_') {
        range = -5 + (Math.abs(query[k] - tp[k]) / 0.5);
        count += range;
      } else {
        count += ((tp[k] == null) ? 0 : ((query[k] == tp[k]) ? -1 : 1))
      }
    }
    h.push(t, count);
  }
  return h.take(25, true);
};

module.exports = {
  omap, subdir, jw, jr, after, loadjson, writejson, loadchunkedjson, log, pickelt, fe, isError, get, almost,
  trails, fml, distance, observationsAround, Trail, trailFromID, OrderedHeap, placesAround, search, getPlace,
};
