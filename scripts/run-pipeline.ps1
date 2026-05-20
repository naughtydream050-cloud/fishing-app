# run-pipeline.ps1
# Starts Ollama + Qwen2.5, then runs the daily forecast pipeline
# Usage: cd fishing-app && .\scripts\run-pipeline.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Write-Host "[pipeline] Root: $root" -ForegroundColor Cyan

# ── Load .env.local ───────────────────────────────────────────────────────────
$envFile = Join-Path $root ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key   = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  env: $key=..." -ForegroundColor DarkGray
        }
    }
    Write-Host "[env] Loaded .env.local" -ForegroundColor Green
} else {
    Write-Warning ".env.local not found at $envFile"
}

# ── Start Ollama if not running ───────────────────────────────────────────────
Write-Host "[ollama] Checking if Ollama is running..." -ForegroundColor Cyan
$ollamaRunning = $false
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $ollamaRunning = $true
    Write-Host "[ollama] Already running." -ForegroundColor Green
} catch {
    Write-Host "[ollama] Not running. Starting..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Write-Host "[ollama] Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    # Retry check
    try {
        Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop | Out-Null
        $ollamaRunning = $true
        Write-Host "[ollama] Server started." -ForegroundColor Green
    } catch {
        Write-Warning "[ollama] Server did not start. Will attempt pipeline anyway."
    }
}

# ── Pull Qwen model if needed ─────────────────────────────────────────────────
$model = "qwen2.5:7b"
if ($ollamaRunning) {
    Write-Host "[ollama] Checking model: $model" -ForegroundColor Cyan
    $tagsJson = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    $tags = ($tagsJson.Content | ConvertFrom-Json).models.name
    if ($tags -contains $model) {
        Write-Host "[ollama] Model '$model' already available." -ForegroundColor Green
    } else {
        Write-Host "[ollama] Pulling '$model' (this may take a few minutes)..." -ForegroundColor Yellow
        & ollama pull $model
        Write-Host "[ollama] Pull complete." -ForegroundColor Green
    }
}

# ── Ensure tsx is installed ───────────────────────────────────────────────────
Write-Host "[npm] Checking tsx..." -ForegroundColor Cyan
Set-Location $root
if (-not (Get-Command "tsx" -ErrorAction SilentlyContinue)) {
    Write-Host "[npm] Installing tsx..." -ForegroundColor Yellow
    npm install --save-dev tsx
}

# ── Run forecast pipeline ─────────────────────────────────────────────────────
Write-Host "[pipeline] Running generate-forecasts.ts..." -ForegroundColor Cyan

$env:OLLAMA_HOST  = "http://localhost:11434"
$env:OLLAMA_MODEL = $model

npx tsx scripts/generate-forecasts.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[pipeline] SUCCESS" -ForegroundColor Green
} else {
    Write-Host "`n[pipeline] FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}
