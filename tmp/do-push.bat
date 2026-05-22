@echo off
cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\ORIG_HEAD.lock" 2>nul
echo.
git log --oneline -3
echo.
echo git push origin HEAD:main:
git push origin HEAD:main
echo.
echo Push exit code: %ERRORLEVEL%
echo Done.
pause
