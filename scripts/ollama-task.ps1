<#
.SYNOPSIS
  Ollama HTTP API にspecを渡して tmp/ollama-output.md に保存する

.PARAMETER Model
  Ollamaモデル名 (例: qwen2.5:3b)

.PARAMETER Spec
  specファイルのパス (例: .\tmp\task-spec.md)

.PARAMETER TimeoutSec
  タイムアウト秒数 (default: 90)

.EXAMPLE
  .\scripts\ollama-task.ps1 -Model qwen2.5:3b -Spec .\tmp\task-spec.md -TimeoutSec 90
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Model,

    [Parameter(Mandatory=$true)]
    [string]$Spec,

    [int]$TimeoutSec = 90
)

$outputPath = ".\tmp\ollama-output.md"
$endpoint   = "http://localhost:11434/api/generate"

# specファイル確認
if (-not (Test-Path $Spec)) {
    Write-Error "Spec file not found: $Spec"
    exit 1
}

# tmpディレクトリ確認
if (-not (Test-Path ".\tmp")) {
    New-Item -ItemType Directory -Path ".\tmp" | Out-Null
}

$specContent = Get-Content -Path $Spec -Raw -Encoding UTF8

$prompt = @"
You are a senior TypeScript/Next.js developer working on a fishing forecast web app.
Follow the spec below exactly. Output only unified diff or the requested files — no explanations, no extra code.

$specContent
"@

# JSON body構築
$body = @{
    model  = $Model
    prompt = $prompt
    stream = $false
} | ConvertTo-Json -Depth 3 -Compress

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "Model: $Model  Spec: $Spec  Timeout: ${TimeoutSec}s" -ForegroundColor Cyan
Write-Host "Calling Ollama HTTP API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri $endpoint `
        -Method POST `
        -Body $body `
        -ContentType "application/json; charset=utf-8" `
        -TimeoutSec $TimeoutSec `
        -UseBasicParsing `
        -ErrorAction Stop

    $json     = $response.Content | ConvertFrom-Json
    $result   = $json.response

    $header = "# Ollama Output`n`nModel: $Model`nSpec: $Spec`nTimestamp: $timestamp`n`n---`n`n"
    ($header + $result) | Out-File -FilePath $outputPath -Encoding UTF8

    Write-Host "Done → $outputPath" -ForegroundColor Green
    Write-Host "`n--- PREVIEW (first 30 lines) ---" -ForegroundColor Cyan
    $result -split "`n" | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
    exit 0
}
catch [System.Net.WebException] {
    if ($_.Exception.Status -eq [System.Net.WebExceptionStatus]::Timeout) {
        "TIMEOUT: ollama exceeded ${TimeoutSec}s — fallback to Claude direct implementation" |
            Out-File -FilePath $outputPath -Encoding UTF8
        Write-Warning "TIMEOUT — Ollama委譲をスキップ。Claude直接実装に切り替えてください。"
        exit 1
    }
    $msg = "ERROR: $($_.Exception.Message)"
    $msg | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Error $msg
    exit 1
}
catch {
    $msg = "ERROR: $($_.Exception.Message)"
    $msg | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Error $msg
    exit 1
}
