const lib = require('./lib.js');
const config = require('./config.js');
const express = require('express');
const csv = require('./convertCSV.js');
const https = require('https');
const fs = require('fs');
const app = express();
const httpport = 5000, httpsport = 5050;

app.use('/', (req, res, next) => { lib.log(req.ip, req.method, req.url); next(); });
app.use('/', express.static('static'));
app.use(express.json({ limit: '10mb', }));

app.post('/issue/:place/:type/:lat/:lon', (req, res) => {
  lib.writejson('./issuereports.json', {
    time: Date.now(),
    place: req.params.place,
    type: req.params.type,
    lat: req.params.lat,
    lon: req.params.lon,
    image: lib.saveImage(req.body.image),
  }, { append: true, });

  res.send(lib.jw({}));
});

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
        const lat = (tp.bounds.bottom + tp.bounds.top) / 2;
              lon = (tp.bounds.left + tp.bounds.right) / 2;
        tp.rocks = lib.rocksAround(lat, lon);
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

app.get('/getScores', (req, res) => {});

console.log('Routes created.');
const server = https.createServer({
  key: fs.readFileSync(config.key),
  cert: fs.readFileSync(config.cert),
}, app);

const redirector = express();
redirector.use('/', (req, res) => {
  res.append('Location', 'https://' + config.httpsDomain + req.url);
  res.sendStatus(307);
});

server.listen(httpsport, () => { console.log(`Listening on port ${httpsport}`); });
redirector.listen(httpport, () => { console.log('Http redirector started on ' + httpport); });

console.log('Memory usage at rest:', (process.memoryUsage().heapUsed / 1024) / 1024, 'mb');
