#!/bin/bash
set -e

NATS_URL="${NATS_URL:-nats://localhost:4225}"
NATS_HTTP_PORT="${NATS_HTTP_PORT:-8225}"

echo "Waiting for NATS to be ready..."
until curl -f -s "http://localhost:${NATS_HTTP_PORT}/healthz" > /dev/null 2>&1; do
    echo "Waiting for NATS..."
    sleep 2
done

echo "NATS is ready!"

# Check JetStream status
echo "Checking JetStream status..."
curl -s "http://localhost:${NATS_HTTP_PORT}/jsz" | jq '.' || {
    echo "JetStream may not be enabled or jq is not installed"
}

# Create JetStream streams and subjects (if needed)
# This can be done via NATS CLI or via your application code
echo ""
echo "NATS setup complete!"
echo "NATS URL: ${NATS_URL}"
echo "Monitoring: http://localhost:${NATS_HTTP_PORT}"

