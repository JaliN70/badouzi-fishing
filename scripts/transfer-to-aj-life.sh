#!/usr/bin/env bash
# Move JaliN70/badouzi-fishing → AJ-LIFE/badouzi-fishing (GitHub org must exist first).
set -euo pipefail

ORG="AJ-LIFE"
REPO="badouzi-fishing"
FROM="JaliN70/${REPO}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! gh api "orgs/${ORG}" &>/dev/null; then
  echo "Organization https://github.com/${ORG} not found." >&2
  echo "Create it first: https://github.com/organizations/new" >&2
  exit 1
fi

echo "Transferring ${FROM} → ${ORG}/${REPO} ..."
gh api -X POST "repos/${FROM}/transfer" -f "new_owner=${ORG}"

echo "Waiting for transfer to settle ..."
sleep 5

git remote remove github 2>/dev/null || true
git remote add github "https://github.com/${ORG}/${REPO}.git"
git fetch github main

echo "Ensuring Pages can deploy from main ..."
gh api -X POST "repos/${ORG}/${REPO}/environments/github-pages/deployment-branch-policies" \
  -f name=main 2>/dev/null || true

gh api -X PUT "repos/${ORG}/${REPO}/pages" -f build_type=workflow 2>/dev/null || true

gh workflow run deploy-pages.yml --repo "${ORG}/${REPO}" --ref main 2>/dev/null || true

echo ""
echo "Done."
echo "  Repo:  https://github.com/${ORG}/${REPO}"
echo "  Play:  https://${ORG,,}.github.io/${REPO}/"
echo "  Push:  git push github main"
