#!/usr/bin/env bash

target_server=wren@23.95.110.141
sess_name=server

if [ "$1" == connect ]; then 
  ssh -M -S sshconnection -i ~/.ssh/server_id_rsa -t $target_server
fi

if [ "$1" == login ]; then 
  ssh -S sshconnection -i ~/.ssh/server_id_rsa -t $target_server
fi

if [ "$1" == deploy ]; then 
  scp -o 'ControlPath sshconnection' -i ~/.ssh/server_id_rsa -Cr *.sh *.js *.json static $target_server:~/coloradoTrails
  ssh -S sshconnection -i ~/.ssh/server_id_rsa -t $target_server "cd ~/coloradoTrails; bash deploy.sh run;"
fi

if [ "$1" == deployinat ]; then 
  scp -o 'ControlPath sshconnection' -i ~/.ssh/server_id_rsa -Cr inat $target_server:~/coloradoTrails
fi

if [ "$1" == run ]; then 
  if tmux has-session -t $sess_name; then
    tmux send-keys -t $sess_name "C-cC-c"
    sleep 3.0
    tmux kill-session -t $sess_name
  fi
  tmux new -s $sess_name "./deploy.sh runsession"
fi

if [ "$1" == runsession ]; then
  (node server.js >> log.txt 2>&1) & pid=$!
  tail -f log.txt
  trap "echo 'Shutting server down.'; kill -9 $pid; exit 0" SIGINT SIGTERM
fi

if [ "$1" == repl ]; then
  node --experimental-repl-await --experimental-worker -i -e 'lib = require("./lib.js")'
fi
