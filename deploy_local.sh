#!/usr/bin/env bash
# Build and run the frontend and backend locally without Docker.
# Usage: ./deploy_local.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

pushd packages/frontend
pnpm install
pnpm build
pnpm start &
FRONTEND_PID=$!
popd

pushd packages/backend
if [ ! -d .venv ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!
deactivate
popd

trap "kill $FRONTEND_PID $BACKEND_PID" EXIT
wait $FRONTEND_PID $BACKEND_PID
