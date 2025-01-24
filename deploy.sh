#!/bin/bash
kill $(cat app.pid)
git pull
npx tsc
nohup node dist/app.js > app.log 2>&1 &
echo $! > app.pid
disown