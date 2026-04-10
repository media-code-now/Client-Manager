#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir('/Users/noamsadi/Downloads/Client-Manager-main/Client-Manager')

print("=" * 80)
print("GIT PUSH SCRIPT")
print("=" * 80)
print()

# Check status
print("Checking git status...")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
print("Modified files:")
print(result.stdout)
print()

# Check if changes are staged
print("Checking staged changes...")
result = subprocess.run(['git', 'diff', '--cached', '--stat'], capture_output=True, text=True)
if result.stdout:
    print(result.stdout)
else:
    print("No staged changes found. Running git add -A...")
    result = subprocess.run(['git', 'add', '-A'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Files staged successfully")
    else:
        print(f"❌ Error staging files: {result.stderr}")
        sys.exit(1)

print()

# Commit changes
print("Creating commit...")
commit_message = "fix: resolve critical database initialization and environment configuration issues"
result = subprocess.run(['git', 'commit', '-m', commit_message], capture_output=True, text=True)

if result.returncode == 0:
    print(f"✅ Commit created: {commit_message}")
elif "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
    print("ℹ️  No changes to commit (changes may already be committed)")
else:
    print(f"Error creating commit: {result.stderr}")

print()

# Show commit log
print("Recent commits:")
result = subprocess.run(['git', 'log', '--oneline', '-5'], capture_output=True, text=True)
print(result.stdout)
print()

# Push to GitHub
print("Pushing to GitHub...")
result = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True)

if result.returncode == 0:
    print("✅ Successfully pushed to GitHub!")
    print(result.stdout)
elif "up-to-date" in result.stdout or "up to date" in result.stdout:
    print("ℹ️  Branch is already up to date with origin/main")
    print(result.stdout)
else:
    print(f"Push output: {result.stdout}")
    if result.stderr:
        print(f"Push errors: {result.stderr}")

print()
print("=" * 80)
print("OPERATION COMPLETE")
print("=" * 80)
