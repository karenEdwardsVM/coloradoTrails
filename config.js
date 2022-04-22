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
  httpsDomain: 'localhost:5000',
  httpDomain: 'localhost:5001',
  key: 'localhost.key',
  cert: 'localhost.crt',
};
