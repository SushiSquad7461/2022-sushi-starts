#!/bin/sh
if [ "$#" -eq 0 ]; then
    cd /app
    node index.js &
    app_pid=$!

    trap "kill $app_pid" INT TERM
    wait
fi

exec "$@"
