const fs = require('fs');

const toJSON = (fn) => {
  const s = fs.readFileSync(fn).toString();
  let lines = s.split("\n");
  lines = lines.map(e => e.split(","));
  const json = [];
  for (let i = 0; i < lines.length; i++) {
    const d = {};
    for (let j = 0; j < lines[i].length; j++) {
      d[lines[0][j]] = lines[i][j];
    }
    json.push(d);
  }
  return json;
};


module.exports = {toJSON};
