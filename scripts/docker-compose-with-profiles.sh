#!/bin/bash
# Docker Compose wrapper that automatically adds --profile flags based on .env ENABLE_* variables
# Usage: ./scripts/docker-compose-with-profiles.sh [docker-compose-file] [docker-compose-args...]

set -e

# Get the compose file (first argument) or default to docker-compose.yml
COMPOSE_FILE="${1:-docker-compose.yml}"
shift || true

# Build profile list based on .env flags
PROFILES="client"

# Check if .env exists
if [ -f .env ]; then
    # Check each enable flag and add corresponding profile if enabled
    if grep -qiE "^[[:space:]]*ENABLE_LOCALSTACK[[:space:]]*=[[:space:]]*true" .env 2>/dev/null; then
        PROFILES="$PROFILES localstack"
    fi
    
    if grep -qiE "^[[:space:]]*ENABLE_NATS[[:space:]]*=[[:space:]]*true" .env 2>/dev/null; then
        PROFILES="$PROFILES nats"
    fi
    
    if grep -qiE "^[[:space:]]*ENABLE_KAFKA[[:space:]]*=[[:space:]]*true" .env 2>/dev/null; then
        PROFILES="$PROFILES kafka"
    fi
fi

# Build --profile flags
PROFILE_FLAGS=""
for profile in $PROFILES; do
    PROFILE_FLAGS="$PROFILE_FLAGS --profile $profile"
done

# Show which profiles are being used
echo "Using profiles: $PROFILES" >&2

# Execute docker-compose with the profile flags
exec docker-compose -f "$COMPOSE_FILE" $PROFILE_FLAGS "$@"

