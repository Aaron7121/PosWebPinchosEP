#!/bin/sh
set -eu

/bin/sh /usr/local/bin/generar-certificado.sh
exec /docker-entrypoint.sh "$@"