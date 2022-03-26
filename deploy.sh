#!/usr/bin/env bash

if [ "$1" == run ]; then
  node index.js
fi


if [ "$1" == repl ]; then
  node --experimental-repl-await --experimental-worker -i -e 'lib = require("./lib.js")'
fi
