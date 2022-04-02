const lib = require('./lib.js');
const express = require('express');
const csv = require('./convertCSV.js');
const app = express();
const p = 5000;

app.use('/', express.static('static'));

app.get('/gettrail/:id', (req, res) => {
  res.send(lib.jw(lib.trails.features[parseInt(req.params.id)]));
});

app.get('/getaround/:lat/:lon/:rad', (req, res) => {
  const out = [],
        lat = Number(req.params.lat),
        lon = Number(req.params.lon),
        rad = Number(req.params.rad);

  for (const t of lib.trails.features) {
    if (t && t.geometry && t.geometry.coordinates && t.geometry.coordinates.length > 0) {
      let ok = false;
      // we can look at any coordinate instead of first, middle, last, if performance allows.
      //   currently most of the time this route takes is in sending the response back.
      for (const c of lib.fml(t.geometry.coordinates)) {
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
  //console.log(csv.toJSON('inat/observations-2022.csv'));
  res.send(lib.jw(obs));
});

app.listen(p, () => {
  console.log(`Example app listening on port ${p}`);
});

