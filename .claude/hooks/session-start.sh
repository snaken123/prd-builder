#!/bin/bash
set -euo pipefail

npm install
npm install --prefix client
npm install --prefix server

# Sync env vars (Neon DATABASE_URL, JWT secret, etc.) from Vercel.
# Requires VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID set as environment secrets.
if [ -n "${VERCEL_TOKEN:-}" ] && [ -n "${VERCEL_ORG_ID:-}" ] && [ -n "${VERCEL_PROJECT_ID:-}" ]; then
  npx --yes vercel@latest env pull .env.local --yes --token "$VERCEL_TOKEN" \
    || echo "vercel env pull failed — check VERCEL_TOKEN/VERCEL_ORG_ID/VERCEL_PROJECT_ID"
else
  echo "Skipping vercel env pull: set VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID to auto-sync .env.local"
fi
