const lib = require('./lib.js');
const express = require('express');
const csv = require('./convertCSV.js');
const app = express();
const p = 5000;

app.use('/', express.static('static'));

app.get('/gettrail/:id', (req, res) => {
  res.send(lib.jw(lib.trailFromID(parseInt(req.params.id), true)));
});

app.get('/getplace/:id', (req, res) => {
  const id = Number(req.params.id);
  const trails = [];
  for (let i = 0; i < lib.trails.features.length; i++) {
    const t = lib.trails.features[i];
    if (t.properties.place_id == id) {
      trails.push(lib.trailFromID(i, true));
    }
  }
  res.send(lib.jw({trails}));
});

app.get('/getaround/:lat/:lon/:rad', (req, res) => {
  const out = [],
        lat = Number(req.params.lat),
        lon = Number(req.params.lon),
        rad = Number(req.params.rad);

  for (let i = 0; i < lib.trails.features.length; i++) {
    const t = lib.trailFromID(i);
    if (t && t.geometry && t.geometry.length > 0) {
      let ok = false;
      // we can look at any coordinate instead of first, middle, last, if performance allows.
      //   currently most of the time this route takes is in sending the response back.
      for (const c of lib.fml(t.geometry)) {
        if (lib.distance(lat, lon, c[0], c[1]) < rad) {
          ok = true; break;
        }
      }
      if (ok) { out.push(t); }
    }
  }
  res.send(lib.jw({trails: out}));
});

app.get('/trailcount', (req, res) => {
  res.send(lib.jw({length: lib.trails.features.length}));
});

app.get('/savedTrails', (req, res) => {});

app.get('/observations', (req, res) => {
  const obs = csv.toJSON('inat/observations-2022.csv')
  res.send(lib.jw(obs));
});

app.listen(p, () => {
  console.log(`Example app listening on port ${p}`);
});

