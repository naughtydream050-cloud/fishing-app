param(
    [string]$Model,
    [string]$Spec,
    [int]$TimeoutSec = 90
)

$null = New-Item -ItemType Directory -Force ".\tmp"
$specContent = Get-Content $Spec -Raw -Encoding UTF8
$outputPath = ".\tmp\ollama-output.md"
$tmpInput   = ".\tmp\ollama-input.txt"
$specContent | Out-File $tmpInput -Encoding UTF8

$proc = Start-Process -FilePath "ollama" `
    -ArgumentList "run", $Model `
    -RedirectStandardInput $tmpInput `
    -RedirectStandardOutput $outputPath `
    -PassThru -NoNewWindow

$finished = $proc.WaitForExit($TimeoutSec * 1000)
if (-not $finished) {
    $proc.Kill()
    "TIMEOUT: ollama run exceeded ${TimeoutSec}s" | Out-File $outputPath -Encoding UTF8
    Write-Warning "TIMEOUT — Ollama委譲をスキップ。Claudeが直接実装します。"
    exit 1
}
Write-Host "Done → $outputPath"
