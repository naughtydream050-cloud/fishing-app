@echo off
chcp 65001 >nul
SET PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin
echo [git] Phase 2 push to GitHub...

cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

REM Add remote if not set
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [git] Adding remote origin...
    git remote add origin https://github.com/naughtydream050-cloud/fishing-app.git
)

REM Stage all Phase 2 files
git add types\fish.ts types\region.ts types\forecast.ts
git add lib\jma.ts lib\tide.ts lib\scoring.ts lib\forecasts.ts lib\mockForecasts.ts lib\jsonld.ts
git add app\region\
git add scripts\generate-forecasts.ts scripts\run-pipeline.ps1
git add supabase\migrations\
git add .github\workflows\forecast-cron.yml
git add package.json
git add app\page.tsx

REM Commit
git commit -m "feat: Phase 2 GEO pipeline - JMA fetch, scoring engine, Supabase real data"

REM Push
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo [git] SUCCESS - Vercel will auto-deploy
) else (
    echo.
    echo [git] Push failed. Check GitHub token/remote.
)

pause
