#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HF_REPO="serJD/ifcore-platform"

cd "$SCRIPT_DIR"

git -C "$SCRIPT_DIR/.." submodule update --init --recursive --remote

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

rsync -a --exclude='.git' --exclude='__pycache__' \
    --exclude='*.pdf' --exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' \
    --exclude='*.gif' --exclude='*.zip' --exclude='*.mp4' --exclude='*.mov' \
    --exclude='*.ifc' --exclude='*.ifczip' --exclude='*.glb' --exclude='*.obj' \
    . "$TMPDIR/"

find "$TMPDIR/teams" -name ".git" -type f -delete 2>/dev/null || true
find "$TMPDIR/teams" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

cd "$TMPDIR"

git init -b main
git add .
git commit -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
# Use token auth in CI (set HF_TOKEN env var or GitHub secret)
if [ -n "${HF_TOKEN:-}" ]; then
    HF_REMOTE="https://serJD:${HF_TOKEN}@huggingface.co/spaces/$HF_REPO"
else
    HF_REMOTE="https://huggingface.co/spaces/$HF_REPO"
fi
git remote add hf "$HF_REMOTE"
git push hf main --force

echo "Deployed to https://huggingface.co/spaces/$HF_REPO"
