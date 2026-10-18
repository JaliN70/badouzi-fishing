#!/usr/bin/env bash
# Usage: ./scripts/setup-github-pages.sh GITHUB_OWNER/REPO_NAME
# Example: ./scripts/setup-github-pages.sh jalin-you/badouzi-fishing
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 owner/repo" >&2
  exit 1
fi

REPO="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote get-url github &>/dev/null; then
  git remote add github "https://github.com/${REPO}.git"
  echo "Added remote github -> https://github.com/${REPO}.git"
fi

git push -u github main

echo ""
echo "Next in GitHub:"
echo "  Settings → Pages → Build and deployment → Source: GitHub Actions"
echo "  Then open Actions tab and run 'Deploy GitHub Pages' if needed."
echo "  Site URL: https://${REPO%%/*}.github.io/${REPO##*/}/"
