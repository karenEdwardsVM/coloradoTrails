const lib = require('./lib.js');
const express = require('express');
const app = express();
const p = 5000;

app.use('/', express.static('static'));

const trails = lib.loadjson('./static/trails.js');
app.get('/gettrail/:id', (req, res) => {
  res.send(lib.jw(trails.features[parseInt(req.params.id)]));
});

app.get('/trailcount', (req, res) => {
  res.send(lib.jw({length: trails.features.length}));
});

app.get('/savedTrails', (req, res) => {});

app.listen(p, () => {
  console.log(`Example app listening on port ${p}`);
});

