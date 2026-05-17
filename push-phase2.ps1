# Phase 2 push to GitHub via PowerShell (inherits full user PATH)
$ErrorActionPreference = "Stop"
Set-Location "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

Write-Host "[git] Checking git availability..."
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    # Try common locations
    $candidates = @(
        "C:\Program Files\Git\cmd\git.exe",
        "C:\Program Files (x86)\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\GitHubDesktop\app-3.4.0\resources\app\git\cmd\git.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $gitPath = $c; break }
    }
    if (-not $gitPath) {
        Write-Host "[ERROR] git not found. Install Git for Windows."
        Read-Host "Press Enter to exit"
        exit 1
    }
    $env:PATH = "$env:PATH;$(Split-Path $gitPath)"
}
Write-Host "[git] Using git at: $($gitPath.Source ?? $gitPath)"

Write-Host "[git] Phase 2 push to GitHub..."

# Add remote if not set
$remoteExists = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[git] Adding remote origin..."
    git remote add origin https://github.com/naughtydream050-cloud/fishing-app.git
}

# Stage Phase 2 files
git add types\fish.ts types\region.ts types\forecast.ts
git add lib\jma.ts lib\tide.ts lib\scoring.ts lib\forecasts.ts lib\mockForecasts.ts lib\jsonld.ts
git add app\region\
git add scripts\generate-forecasts.ts
git add supabase\migrations\
git add .github\workflows\forecast-cron.yml
git add package.json
git add app\page.tsx
git add push-phase2.bat push-phase2.ps1

Write-Host "[git] Status:"
git status --short

git commit -m "feat: Phase 2 GEO pipeline - deterministic scoring, no-LLM production pipeline"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[git] Pushing to GitHub..."
    git push origin master
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Pushed! Vercel will auto-deploy."
    } else {
        Write-Host "[FAILED] Push failed. Check GitHub token."
    }
} else {
    Write-Host "[git] Nothing to commit or commit failed."
}

Read-Host "Press Enter to exit"
