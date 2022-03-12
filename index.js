

const express = require('express');
const app = express();
const p = 5000;

app.use('/', express.static('static'));

//app.get('/, (req, res) => {
//});

app.listen(p, () => {
  console.log(`Example app listening on port ${p}`);
});

