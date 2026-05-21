param(
  [string]$Model = "qwen2.5:3b",
  [string]$Spec
)

if (-not $Spec) { Write-Error "-Spec is required"; exit 1 }
if (-not (Test-Path $Spec)) { Write-Error "Spec file not found: $Spec"; exit 1 }

$prompt = Get-Content $Spec -Raw -Encoding UTF8

Write-Host "Sending to Ollama ($Model)..."
try {
  $bodyObj = [ordered]@{ model = $Model; prompt = $prompt; stream = [bool]$false }
  $bodyJson = $bodyObj | ConvertTo-Json -Depth 5 -Compress
  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
  $response = Invoke-RestMethod `
    -Uri "http://localhost:11434/api/generate" `
    -Method Post `
    -Body $bodyBytes `
    -ContentType "application/json"
  $response.response | Out-File -FilePath "tmp\ollama-output.md" -Encoding UTF8
  Write-Host "Done. Output saved to tmp\ollama-output.md"
} catch {
  Write-Error "Ollama request failed: $_"
  exit 1
}
