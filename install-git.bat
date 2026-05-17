@echo off
chcp 65001 >nul
echo [1] Installing Git for Windows via winget (user scope)...
winget install --id Git.Git --scope user --silent --accept-package-agreements --accept-source-agreements
echo winget exit code: %errorlevel%
echo [2] Done.
pause
