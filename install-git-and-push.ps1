# Install Git via winget (user scope = no UAC) then push
$out = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\install-log.txt"
"[1] Starting Git install via winget..." | Tee-Object $out
winget install --id Git.Git --scope user --silent --accept-package-agreements --accept-source-agreements 2>&1 | Tee-Object $out -Append

# Refresh PATH
$userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
$env:PATH = "$userPath;$machinePath"

# Find git
$gitExe = $null
foreach ($candidate in @(
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "C:\Program Files\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Git.Git*\*\cmd\git.exe"
)) {
    $found = Get-Item $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $gitExe = $found.FullName; break }
}

if (-not $gitExe) {
    $gitExe = (Get-Command git -ErrorAction SilentlyContinue)?.Source
}

if (-not $gitExe) {
    "[ERROR] Git not found after install. Check install-log.txt" | Tee-Object $out -Append
    Read-Host "Press Enter to exit"
    exit 1
}

"[2] Git found: $gitExe" | Tee-Object $out -Append
$gitDir = Split-Path $gitExe
$env:PATH = "$env:PATH;$gitDir"

# Now push
Set-Location "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"
"[3] Configuring git..." | Tee-Object $out -Append
& $gitExe config user.email "naughty19960502@gmail.com"
& $gitExe config user.name "naughtydream050-cloud"

# Check remote
$remote = & $gitExe remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    "[3a] Adding remote..." | Tee-Object $out -Append
    & $gitExe remote add origin https://github.com/naughtydream050-cloud/fishing-app.git
}

# Stage all files
"[4] Staging files..." | Tee-Object $out -Append
& $gitExe add -A

"[5] Committing..." | Tee-Object $out -Append
& $gitExe commit -m "feat: Phase 2 GEO pipeline - deterministic scoring, zero-LLM production"

"[6] Pushing..." | Tee-Object $out -Append
& $gitExe push origin master 2>&1 | Tee-Object $out -Append

if ($LASTEXITCODE -eq 0) {
    "[SUCCESS] Pushed to GitHub! Vercel will auto-deploy." | Tee-Object $out -Append
} else {
    "[FAILED] Push failed - may need credentials. Check install-log.txt" | Tee-Object $out -Append
}

Read-Host "Press Enter to exit"
