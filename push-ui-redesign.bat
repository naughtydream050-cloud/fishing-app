@echo off
chcp 65001 >nul
cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

echo [1/4] git setup...
set GIT_EXE=
for %%G in (
  "C:\Users\razor\scoop\shims\git.exe"
  "C:\Program Files\Git\cmd\git.exe"
  "C:\Program Files (x86)\Git\cmd\git.exe"
) do (
  if exist %%G set GIT_EXE=%%G
)

if "%GIT_EXE%"=="" (
  where git >nul 2>&1
  if %errorlevel% == 0 set GIT_EXE=git
)

if "%GIT_EXE%"=="" (
  echo ERROR: git not found
  pause & exit /b 1
)
echo   git: %GIT_EXE%

echo [2/4] Remove lock file if exists...
if exist .git\index.lock del /f .git\index.lock

echo [3/4] Add remote if missing...
%GIT_EXE% remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
  %GIT_EXE% remote add origin https://github.com/naughtydream050-cloud/fishing-app.git
)

echo [4/4] Stage + commit + push...
%GIT_EXE% add -A
%GIT_EXE% commit -m "feat: UI redesign - fishing info first, MTG filter, new pages /deals /forecast /reports /articles /areas"
%GIT_EXE% push origin master

echo.
echo Done! Check Vercel for auto-deploy.
pause
