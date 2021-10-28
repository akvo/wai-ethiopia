#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

#waiting for postgres
until psql --host db:5432 --username wai -w &>/dev/null
do
  echo "Waiting for PostgreSQL..."
  sleep 1
done

wait4ports -q -s 1 -t 60 tcp://localhost:80 tcp://localhost:5000 tcp://localhost:5001

http_get() {
    url="${1}"
    shift
    code="${1}"
    shift
    curl --verbose --url "${url}" "$@" 2>&1 | grep "< HTTP.*${code}"
}

http_get "http://localhost" 200
http_get "http://localhost/api/" 200
http_get "http://localhost/api/docs" 200
http_get "http://localhost/worker" 200
