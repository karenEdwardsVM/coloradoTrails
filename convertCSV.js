const fs = require('fs');

const toJSON = (fn, filter = null) => {
  const s = fs.readFileSync(fn).toString();
  let lines = s.split("\n");
  lines = lines.map(e => e.split(","));
  const json = [];
  for (let i = 1; i < lines.length; i++) {
    const d = {};
    for (let j = 0; j < lines[i].length; j++) {
      if (!filter || filter.has(lines[0][j])) {
        d[lines[0][j]] = lines[i][j];
      }
    }
    json.push(d);
  }
  return json;
};


module.exports = {toJSON};
