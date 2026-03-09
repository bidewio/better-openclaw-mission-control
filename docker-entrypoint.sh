#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Runtime configuration injection for Mission Control
#
# The Vite SPA embeds VITE_CONVEX_URL at build time. When using the pre-built
# Docker image, we replace the build-time placeholder with the runtime value
# so the image works with any Convex backend URL.
#
# Usage:
#   docker run -e VITE_CONVEX_URL=http://my-convex:3210 ghcr.io/bidewio/mission-control
# ──────────────────────────────────────────────────────────────────────────────

PLACEHOLDER="__MISSION_CONTROL_CONVEX_URL_PLACEHOLDER__"

if [ -n "$VITE_CONVEX_URL" ]; then
  echo "Injecting VITE_CONVEX_URL=$VITE_CONVEX_URL into static assets..."
  find /app/dist/assets -name '*.js' -exec sed -i "s|${PLACEHOLDER}|${VITE_CONVEX_URL}|g" {} +
else
  echo "Warning: VITE_CONVEX_URL is not set. Using build-time placeholder value."
  echo "Set VITE_CONVEX_URL to your Convex backend URL (e.g., http://127.0.0.1:3210)"
fi

exec serve -s dist -l 3660
