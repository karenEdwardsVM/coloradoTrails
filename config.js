const lib = require('./lib.js');

const deployed = lib.loadjson('deployed.json');

module.exports = deployed ? {
  dmployed: true,
  httpsDomain: 'trexpedition.org',
  httpDomain: 'trexpedition.org',
  key: 'trexpedition.key',
  cert: 'trexpedition.crt',
} : {
  deployed: false,
  httpsDomain: 'localhost:5050',
  httpDomain: 'localhost:5000',
  key: 'localhost.key',
  cert: 'localhost.crt',
};
