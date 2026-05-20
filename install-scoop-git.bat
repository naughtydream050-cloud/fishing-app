@echo off
chcp 65001 >nul
echo [1] Installing Scoop (no admin needed)...
powershell -ExecutionPolicy Bypass -Command "irm get.scoop.sh | iex"
echo [2] Installing git via Scoop...
powershell -ExecutionPolicy Bypass -Command "scoop install git"
echo [3] Done. Git should now be at %USERPROFILE%\scoop\shims\git.exe
pause
