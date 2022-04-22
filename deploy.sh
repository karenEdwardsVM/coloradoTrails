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
  tmux new -s $sess_name "node server.js"
fi
