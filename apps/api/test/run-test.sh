#!/usr/bin/env bash
# Usage: ./test/run-test.sh test/social.e2e.mjs
set -e

TEST_FILE="${1:?Usage: run-test.sh <test-file>}"
PORT=3001

# Kill anything on port
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 1

# Start server in background
cd "$(dirname "$0")/.."
node dist/main.js &
SERVER_PID=$!

cleanup() { kill $SERVER_PID 2>/dev/null || true; }
trap cleanup EXIT

# Wait for health
for i in $(seq 1 30); do
  if curl -sf http://localhost:$PORT/api/v1/health > /dev/null 2>&1; then
    echo "✅ Server is up"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ Server failed to start"
    exit 1
  fi
  sleep 1
done

# Run test
node "$TEST_FILE"
