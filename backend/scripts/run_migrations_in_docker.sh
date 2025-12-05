#!/bin/bash
# Script to run database migrations in Docker
# Note: Migrations run automatically on application startup
# This script restarts the container to trigger migrations

set -e

echo "Running database migrations in Docker..."

# Try to find the container name
CONTAINER_NAME=$(docker ps --filter "name=api" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "Error: Could not find api-service container"
    echo "Available containers:"
    docker ps --format "{{.Names}}"
    exit 1
fi

echo "Found container: $CONTAINER_NAME"
echo ""
echo "Migrations run automatically when the application starts."
echo "Restarting container to trigger migrations..."
echo ""

# Restart the container (migrations will run on startup)
docker restart "$CONTAINER_NAME"

echo ""
echo "Container restarted. Migrations should run automatically on startup."
echo "Check the logs with: docker logs -f $CONTAINER_NAME"
echo ""
echo "If you need to run migrations manually, you can:"
echo "1. Install sqlx-cli in the container: docker exec $CONTAINER_NAME sh -c 'cargo install sqlx-cli --features postgres'"
echo "2. Then run: docker exec $CONTAINER_NAME sqlx migrate run --database-url \$DATABASE_URL"
echo ""
echo "Or connect to the database directly and run the SQL manually."

