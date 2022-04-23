const lib = require('./lib.js');
const config = require('./config.js');
const express = require('express');
const csv = require('./convertCSV.js');
const https = require('https');
const fs = require('fs');
const app = express();
const httpport = 5000, httpsport = 5050;

app.use('/', express.static('static'));

app.get('/gettrail/:id', (req, res) => {
  res.send(lib.jw(lib.trailFromID(parseInt(req.params.id), true)));
});

app.get('/getplace/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!!id) {
    res.send(lib.jw({
      trails: lib.getPlace(id).map(t => {
        const tp = new lib.Trail({trail: t});
        tp.observations = lib.observationsAround(tp);
        return tp;
      }),
    }));
  } else {
    res.send(lib.jw({trails: null}));
  }
});

app.get('/getaround/:lat/:lon/:rad', (req, res) => {
  const lat = Number(req.params.lat),
        lon = Number(req.params.lon),
        rad = Number(req.params.rad),
        out = lib.placesAround(lat, lon, rad);
  res.send(lib.jw({trails: out}));
});

app.get('/searcharound/:lat/:lon/:rad', (req, res) => {
  const lat = Number(req.params.lat),
        lon = Number(req.params.lon),
        rad = Number(req.params.rad),
        q = req.query,
        data = lib.search(q, lat, lon, rad);
  res.send(lib.jw(data));
});

app.get('/trailcount', (req, res) => {
  res.send(lib.jw({length: lib.trails.features.length}));
});

app.get('/savedTrails', (req, res) => {});

app.get('/observations', (req, res) => {
  const obs = csv.toJSON('inat/observations-2022.csv')
  res.send(lib.jw(obs));
});

console.log('App loaded.');
const server = https.createServer({
  key: fs.readFileSync(config.key),
  cert: fs.readFileSync(config.cert),
}, app);

const redirector = express();
redirector.use('/', (req, res) => {
  res.append('Location', 'https://' + config.httpsDomain + req.url);
  res.sendStatus(307);
});

server.listen(httpsport, () => { console.log(`Example app listening on port ${httpsport}`); });
redirector.listen(httpport, () => { console.log('http redirector started'); });
