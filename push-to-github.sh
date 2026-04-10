#!/bin/bash
cd /Users/noamsadi/Downloads/Client-Manager-main/Client-Manager

# Check git status
echo "=== Git Status ==="
git status

# Show recent commits
echo ""
echo "=== Recent Commits ==="
git log --oneline -5

# Check if there are staged changes
echo ""
echo "=== Staged Changes ==="
git diff --cached --stat

# Push to GitHub
echo ""
echo "=== Pushing to GitHub ==="
git push origin main

echo ""
echo "=== Push Complete ==="
git log --oneline -3
