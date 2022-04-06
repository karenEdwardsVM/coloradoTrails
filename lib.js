const fs = require('fs'),
      https = require('https'),
      csv = require('./convertCSV.js');

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
  return [].concat(obs2022, obs2021);
}

const Trail = require('./static/trail.js').Trail;

const trails = loadjson('./static/trails.json');
const observations = loadObservations();
console.log(observations);
const obsCoords = observations.map((e, i) => [Number(e.latitude), Number(e.longitude), i]); // array of [lat, long] arrays
const sortedObs = obsCoords.sort((a, b) => a[0] - b[0]);

const fml = (cs) => {
  return [cs[0], cs[Math.floor(cs.length / 2)], cs[cs.length - 1]];
};

const distance = (x, y, x1, y1) => {
  return Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2));
};

// coordinates is a list of all the coordinates in the trail
// optimize this, when sorting, also check the edge coordinates of the trail for latitude. 
// changed coordinates (a trails coordinates) parameter to a trail
const observationsAround = (trail, rad) => {
  let res = [];
  const bound = trail.bounds;
  const coords = trail.geometry;
  for (let i = 0; i < coords.length; i++) {
    for (let j = 0; j < sortedObs.length; j++) {
      if (bound.top > sortedObs[j][0]) { break; }
      if (distance(coords[i][0], coords[i][1], sortedObs[j][0], sortedObs[j][1]) <= rad) {
        res.push(sortedObs[j][2]);
      }
    }
  }
  return Array.from(new Set(res)).map(e => observations[e]);
};
//observationsAround(trails[30], 0.05);

const trailFromID = (id, withobservations = false) => {
  const trail = new Trail({trail: trails.features[id]});
  if (withobservations) {
    trail.observations = observationsAround(trail, 0.01);
  }
  return trail
  //return new Trail({trail,
  //                  observations: withobservations ? observationsAround(trail.geometry.coordinates, 0.01) : []});
};
console.profile(trailFromID(30, true));
//console.log(trailFromID(30, true));

module.exports = {
  omap, subdir, jw, jr, after, loadjson, writejson, loadchunkedjson, log, pickelt, fe, isError, get, almost,
  trails, fml, distance, observationsAround, Trail, trailFromID,
};
