$message = "Quick Update: $(Get-Date -Format 'HH:mm:ss')"
Write-Host "🚀 Starting One-Click Deploy to KORA..." -ForegroundColor Cyan

# Stage all changes
git add .
Write-Host "✅ Changes staged." -ForegroundColor Green

# Commit with time-stamped message
git commit -m "$message"
Write-Host "✅ Committed as: $message" -ForegroundColor Green

# Push to GitHub (Vercel will see this and auto-deploy)
git push
Write-Host "🔥 Pushed to GitHub! Vercel is now building your live site." -ForegroundColor Yellow
Write-Host "Check it here: https://kora-frontend-steel.vercel.app/" -ForegroundColor Blue
