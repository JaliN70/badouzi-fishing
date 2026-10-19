#!/usr/bin/env bash
# Clone this project under ~/AJ-LIFE/badouzi-fishing on your Mac/Linux machine.
# Usage: curl ... | bash   OR   ./scripts/setup-local-aj-life.sh
set -euo pipefail

BASE="${AJ_LIFE_DIR:-$HOME/AJ-LIFE}"
TARGET="${BASE}/badouzi-fishing"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/JaliN70/badouzi-fishing.git}"

mkdir -p "${BASE}"

if [[ -d "${TARGET}/.git" ]]; then
  echo "Already cloned: ${TARGET}"
  echo "  cd \"${TARGET}\" && git pull && npm install"
  exit 0
fi

git clone "${GITHUB_REPO}" "${TARGET}"
cd "${TARGET}"
npm install

echo ""
echo "Project ready at: ${TARGET}"
echo "  cd \"${TARGET}\""
echo "  npm run dev"
echo "  → http://127.0.0.1:43123"
