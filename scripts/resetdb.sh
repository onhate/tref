#!/bin/bash
set -euo pipefail

# Usage: ./scripts/resetdb.sh [-f]
#  -f  Also remove API migrations

if [[ "${1:-}" == "-f" ]]; then
  rm -rf packages/api/migrations
fi

# Stop and remove containers, networks, volumes
if ! docker compose down -v --remove-orphans; then
  echo "Failed to stop containers"
  exit 1
fi

# Recreate storage directories for bind mounts to avoid permission issues
# See docker-compose.yaml volumes:
#  - ./.sst/storage/postgres
#  - ./.sst/storage/postgres_test
rm -rf .sst/storage
mkdir -p .sst/storage/postgres .sst/storage/postgres_test
# Make sure current user can write; postgres will manage ownership inside container
chmod -R 0777 .sst/storage || true

# Start containers in the background
if ! docker compose up -d; then
  echo "Failed to start containers"
  exit 1
fi

echo "Database containers reset successfully."
