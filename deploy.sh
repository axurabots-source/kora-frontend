#!/bin/bash

# Get current time for commit message
message="Quick Update: $(date +'%H:%M:%S')"

echo -e "\033[0;36m🚀 Starting One-Click Deploy to KORA...\033[0m"

# Stage all changes
git add .
echo -e "\033[0;32m✅ Changes staged.\033[0m"

# Commit with time-stamped message
git commit -m "$message"
echo -e "\033[0;32m✅ Committed as: $message\033[0m"

# Push to GitHub (Vercel will see this and auto-deploy)
git push
echo -e "\033[0;33m🔥 Pushed to GitHub! Vercel is now building your live site.\033[0m"
echo -e "\033[0;34mCheck it here: https://kora-frontend-steel.vercel.app/\033[0m"
