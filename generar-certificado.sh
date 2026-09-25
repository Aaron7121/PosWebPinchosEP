#!/usr/bin/env bash
set -euo pipefail

IP="${1:-$(hostname -I | awk '{print $1}')}"
CERT_DIR="$(pwd)/FrontEndPosWeb2026/certs"

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker no está disponible o tu usuario no tiene permisos."
  exit 1
fi

if [[ ! -f docker-compose.yml ]]; then
  echo "Error: ejecuta este script desde la carpeta que contiene docker-compose.yml."
  exit 1
fi

mkdir -p "$CERT_DIR"

docker run --rm \
  -v "$CERT_DIR:/certs" \
  alpine:latest \
  sh -c "apk add --no-cache openssl >/dev/null 2>&1 &&
    openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout /certs/pos-web.key \
      -out /certs/pos-web.crt \
      -days 365 \
      -subj '/CN=$IP' \
      -addext 'subjectAltName=IP:$IP'"

chmod 600 "$CERT_DIR/pos-web.key"

echo "Certificado creado para: $IP"
echo "Archivo público: $CERT_DIR/pos-web.crt"
echo "Ahora ejecuta: docker compose up -d --build frontend-web"