@echo off
cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

echo === Removing lock files ===
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\ORIG_HEAD.lock" 2>nul
del /f /q ".git\MERGE_HEAD" 2>nul

echo === git status ===
git status

echo === git add ===
git add lib/dataAccess.ts lib/forecastRepository.ts

echo === git commit ===
git commit -m "fix: dataAccess.ts restore full file + fix imports (isFishingProduct/classifyGearCategory)"

echo === git push origin HEAD:main ===
git push origin HEAD:main

echo.
echo Exit code: %ERRORLEVEL%
echo Done.
pause
