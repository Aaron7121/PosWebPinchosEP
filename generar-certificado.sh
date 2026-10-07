#!/bin/sh
set -eu

CERT_DIR="${CERT_DIR:-/etc/nginx/certs}"
CERT_HOST="${CERT_HOST:-localhost}"
CERT_FILE="$CERT_DIR/pos-web.crt"
KEY_FILE="$CERT_DIR/pos-web.key"

mkdir -p "$CERT_DIR"

if [ -s "$CERT_FILE" ] && [ -s "$KEY_FILE" ] \
  && openssl x509 -in "$CERT_FILE" -noout >/dev/null 2>&1 \
  && openssl pkey -in "$KEY_FILE" -noout >/dev/null 2>&1; then
    echo "Usando certificado existente para $CERT_HOST."
    exit 0
fi

SUBJECT_ALT_NAME="DNS:localhost,IP:127.0.0.1"
case "$CERT_HOST" in
    localhost|127.0.0.1 ) ;;
    *[!0-9.]* ) SUBJECT_ALT_NAME="$SUBJECT_ALT_NAME,DNS:$CERT_HOST" ;;
    * ) SUBJECT_ALT_NAME="$SUBJECT_ALT_NAME,IP:$CERT_HOST" ;;
esac

openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days 365 \
    -subj "/CN=$CERT_HOST" \
    -addext "subjectAltName=$SUBJECT_ALT_NAME"

chmod 600 "$KEY_FILE"
echo "Certificado autofirmado creado para $CERT_HOST en $CERT_DIR."