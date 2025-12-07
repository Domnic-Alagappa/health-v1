#!/bin/bash
# Script to run tests using Docker Compose
# Usage: ./scripts/docker-test.sh [test-file-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${GREEN}🐳 Starting Docker Compose test environment...${NC}"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if docker-compose.test.yml exists
if [ ! -f "docker-compose.test.yml" ]; then
    echo -e "${RED}❌ docker-compose.test.yml not found!${NC}"
    exit 1
fi

# Clean up any existing test containers
echo -e "${YELLOW}🧹 Cleaning up any existing test containers...${NC}"
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

# Build and start test services
echo -e "${GREEN}🔨 Building test image...${NC}"
docker-compose -f docker-compose.test.yml build

echo -e "${GREEN}🚀 Starting test services...${NC}"
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Capture exit code
EXIT_CODE=$?

# Clean up
echo -e "${YELLOW}🧹 Cleaning up test containers...${NC}"
docker-compose -f docker-compose.test.yml down -v

# Exit with the test exit code
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE

