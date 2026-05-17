# fishing-app: GitHub push + Vercel deploy
# Run this once from the fishing-app directory

Set-Location $PSScriptRoot

git init
git add .
git commit -m "initial commit: fishing-app Phase 1 MVP"
git branch -M main
git remote add origin https://github.com/naughtydream050-cloud/fishing-app.git
git push -u origin main

Write-Host ""
Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
Write-Host "Next: Vercel will import automatically if connected, or visit:"
Write-Host "https://vercel.com/new?import=https://github.com/naughtydream050-cloud/fishing-app"
Start-Process "https://vercel.com/new?import=https://github.com/naughtydream050-cloud/fishing-app"
