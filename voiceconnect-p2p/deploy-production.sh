#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if [ ! -f .env.production ]; then echo "Missing .env.production; copy .env.production.example and set real values." >&2; exit 2; fi
set -a
. ./.env.production
set +a
: "${DOMAIN:?DOMAIN required}" "${ACME_EMAIL:?ACME_EMAIL required}" "${TURN_EXTERNAL_IP:?TURN_EXTERNAL_IP required}" "${TURN_SHARED_SECRET:?TURN_SHARED_SECRET required}" "${VOICECONNECT_AUTH_SECRET:?VOICECONNECT_AUTH_SECRET required}" "${VOICECONNECT_ADMIN_SECRET:?VOICECONNECT_ADMIN_SECRET required}"
[ "${#VOICECONNECT_AUTH_SECRET}" -ge 32 ] || { echo "VOICECONNECT_AUTH_SECRET must be at least 32 chars" >&2; exit 2; }
[ "${#TURN_SHARED_SECRET}" -ge 32 ] || { echo "TURN_SHARED_SECRET must be at least 32 chars" >&2; exit 2; }
[ "${#VOICECONNECT_ADMIN_SECRET}" -ge 32 ] || { echo "VOICECONNECT_ADMIN_SECRET must be at least 32 chars" >&2; exit 2; }
docker compose -f docker-compose.production.yml config >/dev/null
docker compose -f docker-compose.production.yml up -d --build
echo "Services started. Verify DNS, firewall, TLS certificate, /api/health and TURN reachability from a separate network."
