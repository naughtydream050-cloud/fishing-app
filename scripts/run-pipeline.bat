@echo off
chcp 65001 >nul
echo [pipeline] Starting forecast pipeline (qwen2.5:3b + D:\Ollama\models)...

cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

REM Check / start Ollama
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [ollama] Starting Ollama...
    set OLLAMA_MODELS=D:\Ollama\models
    start /b ollama serve
    timeout /t 6 /nobreak >nul
)

REM Ensure qwen2.5:3b is available
echo [ollama] Checking qwen2.5:3b...
ollama pull qwen2.5:3b

REM Set Ollama env
set OLLAMA_HOST=http://localhost:11434
set OLLAMA_MODEL=qwen2.5:3b

REM Run pipeline using Node --env-file to load .env.local safely
echo [pipeline] Running...
npx --yes tsx --env-file=.env.local scripts\generate-forecasts.ts

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Supabase updated.
) else (
    echo.
    echo [FAILED] Check output above.
)

pause
