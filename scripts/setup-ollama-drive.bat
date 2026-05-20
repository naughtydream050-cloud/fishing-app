@echo off
chcp 65001 >nul
echo ============================================
echo  Ollama D-Drive Storage Migration + Pipeline
echo ============================================
echo.

REM ── Step 1: Create D:\Ollama\models ──────────────────────────────────────────
echo [1/5] Creating D:\Ollama\models...
if not exist "D:\Ollama" mkdir "D:\Ollama"
if not exist "D:\Ollama\models" mkdir "D:\Ollama\models"
echo      Done: D:\Ollama\models created

REM ── Step 2: Set OLLAMA_MODELS user env var ────────────────────────────────────
echo [2/5] Setting OLLAMA_MODELS=D:\Ollama\models (user env var)...
setx OLLAMA_MODELS "D:\Ollama\models"
set OLLAMA_MODELS=D:\Ollama\models
echo      Done.

REM ── Step 3: Kill existing Ollama ──────────────────────────────────────────────
echo [3/5] Stopping Ollama if running...
taskkill /f /im ollama.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo      Done.

REM ── Step 4: Start Ollama with new model path ──────────────────────────────────
echo [4/5] Starting Ollama (models -> D:\Ollama\models)...
set OLLAMA_MODELS=D:\Ollama\models
start /b ollama serve
timeout /t 5 /nobreak >nul

REM Verify Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo      WARNING: Ollama may not have started. Waiting 10 more seconds...
    timeout /t 10 /nobreak >nul
)
echo      Done.

REM ── Step 5: Pull qwen2.5:3b ───────────────────────────────────────────────────
echo [5/5] Pulling qwen2.5:3b (smaller model, ~1.9GB)...
set OLLAMA_HOST=http://localhost:11434
ollama pull qwen2.5:3b
echo      Done.

REM ── Run pipeline ──────────────────────────────────────────────────────────────
echo.
echo ============================================
echo  Running forecast pipeline with qwen2.5:3b
echo ============================================

cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

REM Load .env.local
for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
    if not "%%A"=="" if not "%%A:~0,1%"=="#" set "%%A=%%B"
)

set OLLAMA_HOST=http://localhost:11434
set OLLAMA_MODEL=qwen2.5:3b

call npx tsx scripts/generate-forecasts.ts

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] 16件の予報をSupabaseに書き込みました
) else (
    echo.
    echo [FAILED] エラーが発生しました
)

echo.
echo Model storage: D:\Ollama\models
echo Next run: scripts\run-pipeline.bat
pause
