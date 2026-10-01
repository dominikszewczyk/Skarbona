#!/bin/sh
set -eu

: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:=5432}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_SCHEMA:=skarbona}"

case "$DB_HOST" in
  *:*) DATABASE_HOST="$DB_HOST" ;;
  *) DATABASE_HOST="$DB_HOST:$DB_PORT" ;;
esac

# Decode legacy %XX values once, then encode the password safely for the URL.
DECODED_PASSWORD=$(printf '%b' "${DB_PASSWORD//%/\\x}" 2>/dev/null || printf '%s' "$DB_PASSWORD")
ENCODED_PASSWORD=$(printf '%s' "$DECODED_PASSWORD" | sed 's/%/%25/g; s/:/%3A/g; s/@/%40/g; s/!/%21/g; s/#/%23/g; s/\//%2F/g; s/?/%3F/g')
export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@${DATABASE_HOST}/${DB_NAME}?schema=${DB_SCHEMA}"
exec "$@"
