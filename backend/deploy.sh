#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HF_REPO="serJD/ifcore-platform"

cd "$SCRIPT_DIR"

git -C "$SCRIPT_DIR/.." submodule update --init --recursive

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

rsync -a --exclude='.git' --exclude='__pycache__' . "$TMPDIR/"

find "$TMPDIR/teams" -name ".git" -type f -delete 2>/dev/null || true
find "$TMPDIR/teams" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

cd "$TMPDIR"

git init -b main
git add .
git commit -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git remote add hf "https://huggingface.co/spaces/$HF_REPO"
git push hf main --force

echo "Deployed to https://huggingface.co/spaces/$HF_REPO"
