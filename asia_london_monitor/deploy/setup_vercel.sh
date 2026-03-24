#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 18 ]; then
  echo "Node.js 18+ required. Installing Node.js 20 with nvm..."
  if ! command -v nvm >/dev/null 2>&1; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
    # shellcheck source=/dev/null
    source "$HOME/.nvm/nvm.sh"
  fi
  nvm install 20
  nvm use 20
fi

if ! command -v vercel >/dev/null 2>&1; then
  npm install -g vercel
fi

npm install

if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
fi

echo "Fill .env.local with your API keys before running production workloads."

vercel login

for var in FINNHUB_API_KEY AV_API_KEY TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do
  echo "Adding $var to Vercel production environment"
  vercel env add "$var" production
 done

DEPLOY_OUTPUT="$(vercel --prod)"
echo "$DEPLOY_OUTPUT"
URL="$(echo "$DEPLOY_OUTPUT" | awk '/https:\/\// {print $NF}' | tail -n1)"

echo "Deployment complete. Open: $URL"
echo "Tail logs with: vercel logs --follow"
