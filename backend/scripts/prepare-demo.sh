#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "=== Dubai RealEstate LeadGen — Demo Preparation ==="
echo ""

# 1. Ensure .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "[1/4] Creating .env from .env.example..."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "      Created $BACKEND_DIR/.env"
  echo "      Please review and set: MONGODB_URI, JWT secrets, SMTP creds"
  echo ""
fi

# 2. npm install if needed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "[2/4] Installing backend dependencies..."
  cd "$BACKEND_DIR"
  npm install
  cd "$PROJECT_DIR"
  echo "      Dependencies installed."
  echo ""
fi

# 3. Build backend
echo "[3/4] Building backend..."
cd "$BACKEND_DIR"
npm run build
cd "$PROJECT_DIR"
echo "      Backend built."
echo ""

# 4. Optionally run seed
if [ "${1:-}" = "--seed" ] || [ "${1:-}" = "--seed-only" ]; then
  echo "[4/4] Running demo seed..."
  echo "      This will populate MongoDB with demo data."
  echo ""
  cd "$BACKEND_DIR"
  npm run seed:demo
  cd "$PROJECT_DIR"
  echo ""
fi

echo "=== Preparation complete ==="
