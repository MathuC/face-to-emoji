#!/bin/bash
kill $(cat app.pid)
git pull
npx tsc
nohup node dist/app.js &
disown
echo $! > app.pid