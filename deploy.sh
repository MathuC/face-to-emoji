#!/bin/bash
kill $(cat app.pid)
git pull
npx tsc
nohup node dist/app.js > app.log 2>&1 & # Without '> app.log 2>&1', the workflow job runs forever even if it's nohup
echo $! > app.pid
disown