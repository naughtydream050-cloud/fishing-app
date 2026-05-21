<#
.SYNOPSIS
  外部LLM API にspecを渡して tmp/external-llm-output.md に保存する

.PARAMETER Provider
  API provider: gemini / openrouter / groq

.PARAMETER Model
  モデル名 (例: gemini-2.0-flash-lite / google/gemma-3-12b:free / llama3-8b-8192)

.PARAMETER Spec
  specファイルのパス (例: .\tmp\task-spec.md)

.PARAMETER TimeoutSec
  タイムアウト秒数 (default: 90)

.EXAMPLE
  .\scripts\external-llm-task.ps1 -Provider gemini -Model gemini-2.0-flash-lite -Spec .\tmp\task-spec.md
  .\scripts\external-llm-task.ps1 -Provider openrouter -Model google/gemma-3-12b:free -Spec .\tmp\task-spec.md
  .\scripts\external-llm-task.ps1 -Provider groq -Model llama3-8b-8192 -Spec .\tmp\task-spec.md
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("gemini","openrouter","groq")]
    [string]$Provider,

    [Parameter(Mandatory=$true)]
    [string]$Model,

    [Parameter(Mandatory=$true)]
    [string]$Spec,

    [int]$TimeoutSec = 90
)

$outputPath = ".\tmp\external-llm-output.md"
$timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# tmpディレクトリ確認
if (-not (Test-Path ".\tmp")) {
    New-Item -ItemType Directory -Path ".\tmp" | Out-Null
}

# specファイル確認
if (-not (Test-Path $Spec)) {
    Write-Error "Spec file not found: $Spec"
    exit 1
}

$specContent = Get-Content -Path $Spec -Raw -Encoding UTF8

$systemPrompt = "You are a senior TypeScript/Next.js developer. Follow the spec exactly. Output only the requested code or unified diff — no explanations, no extra text."
$userPrompt   = $specContent

# --- Provider別設定 ---
switch ($Provider) {
    "gemini" {
        $envKey = "GEMINI_API_KEY"
        $apiKey = [System.Environment]::GetEnvironmentVariable($envKey)
        if (-not $apiKey) {
            "MISSING_ENV:$envKey" | Out-File $outputPath -Encoding UTF8
            Write-Warning "MISSING_ENV:$envKey — API keyが未設定です。.env.localまたは環境変数に設定してください。"
            exit 1
        }
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/${Model}:generateContent?key=$apiKey"
        $body = @{
            contents = @(@{
                parts = @(@{ text = "$systemPrompt`n`n$userPrompt" })
            })
            generationConfig = @{ temperature = 0.2; maxOutputTokens = 2048 }
        } | ConvertTo-Json -Depth 6 -Compress
        $contentType = "application/json; charset=utf-8"
    }
    "openrouter" {
        $envKey = "OPENROUTER_API_KEY"
        $apiKey = [System.Environment]::GetEnvironmentVariable($envKey)
        if (-not $apiKey) {
            "MISSING_ENV:$envKey" | Out-File $outputPath -Encoding UTF8
            Write-Warning "MISSING_ENV:$envKey — API keyが未設定です。"
            exit 1
        }
        $endpoint = "https://openrouter.ai/api/v1/chat/completions"
        $body = @{
            model    = $Model
            messages = @(
                @{ role = "system"; content = $systemPrompt }
                @{ role = "user";   content = $userPrompt   }
            )
            stream       = $false
            max_tokens   = 2048
            temperature  = 0.2
        } | ConvertTo-Json -Depth 6 -Compress
        $contentType = "application/json; charset=utf-8"
    }
    "groq" {
        $envKey = "GROQ_API_KEY"
        $apiKey = [System.Environment]::GetEnvironmentVariable($envKey)
        if (-not $apiKey) {
            "MISSING_ENV:$envKey" | Out-File $outputPath -Encoding UTF8
            Write-Warning "MISSING_ENV:$envKey — API keyが未設定です。"
            exit 1
        }
        $endpoint = "https://api.groq.com/openai/v1/chat/completions"
        $body = @{
            model    = $Model
            messages = @(
                @{ role = "system"; content = $systemPrompt }
                @{ role = "user";   content = $userPrompt   }
            )
            stream      = $false
            max_tokens  = 2048
            temperature = 0.2
        } | ConvertTo-Json -Depth 6 -Compress
        $contentType = "application/json; charset=utf-8"
    }
}

# ヘッダー構築（keyは含めない）
$headers = @{ "Content-Type" = $contentType }
if ($Provider -eq "openrouter") {
    $headers["Authorization"]        = "Bearer $apiKey"
    $headers["HTTP-Referer"]         = "https://fishing-app-omega.vercel.app"
    $headers["X-Title"]              = "fishing-app"
}
if ($Provider -eq "groq") {
    $headers["Authorization"] = "Bearer $apiKey"
}

Write-Host "Provider: $Provider  Model: $Model  Timeout: ${TimeoutSec}s" -ForegroundColor Cyan
Write-Host "Calling external API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri $endpoint `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec $TimeoutSec `
        -UseBasicParsing `
        -ErrorAction Stop

    $json = $response.Content | ConvertFrom-Json

    # Provider別レスポンス取得
    $result = switch ($Provider) {
        "gemini"      { $json.candidates[0].content.parts[0].text }
        "openrouter"  { $json.choices[0].message.content }
        "groq"        { $json.choices[0].message.content }
    }

    $header = "# External LLM Output`n`nProvider: $Provider`nModel: $Model`nSpec: $Spec`nTimestamp: $timestamp`n`n---`n`n"
    ($header + $result) | Out-File $outputPath -Encoding UTF8

    Write-Host "Done → $outputPath" -ForegroundColor Green
    Write-Host "`n--- PREVIEW (first 30 lines) ---" -ForegroundColor Cyan
    $result -split "`n" | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
    exit 0
}
catch [System.Net.WebException] {
    if ($_.Exception.Status -eq [System.Net.WebExceptionStatus]::Timeout) {
        "TIMEOUT: $Provider/$Model exceeded ${TimeoutSec}s — fallback to next provider or Claude direct" |
            Out-File $outputPath -Encoding UTF8
        Write-Warning "TIMEOUT — 次のfallbackまたはClaude直接実装に切り替えてください。"
        exit 1
    }
    $msg = "ERROR: $($_.Exception.Message)"
    $msg | Out-File $outputPath -Encoding UTF8
    Write-Error $msg
    exit 1
}
catch {
    $msg = "ERROR: $($_.Exception.Message)"
    $msg | Out-File $outputPath -Encoding UTF8
    Write-Error $msg
    exit 1
}
