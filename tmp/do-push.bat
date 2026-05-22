@echo off
cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"
echo Removing stale lock files...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
echo.
echo git add -A:
git add -A
git status --short > tmp\_gitstatus.txt
for %%A in (tmp\_gitstatus.txt) do if %%~zA==0 (
    echo Nothing to commit, pushing existing main...
) else (
    echo Committing...
    git commit -m "fix: productFilter blacklist vanguard/apparel/non-fishing items"
)
echo.
echo git push origin main:
git push origin main
echo.
echo Done.
pause
