# Deep search for git.exe
$out = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\git-deep-found.txt"
"Searching..." | Out-File $out

# Check VS Code settings for git path
$vsSettings = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $vsSettings) {
    $s = Get-Content $vsSettings -Raw
    if ($s -match '"git.path"') {
        "VS Code git.path: found in settings" | Out-File $out -Append
        $s | Select-String '"git\.path".*' | Out-File $out -Append
    } else {
        "VS Code settings: no git.path configured" | Out-File $out -Append
    }
}

# Check Windows Credential Manager for GitHub
$creds = cmdkey /list 2>&1
$creds | Where-Object { $_ -match "github" } | Out-File $out -Append

# Search common paths
@(
  "C:\Program Files\Git",
  "C:\Program Files (x86)\Git",
  "$env:LOCALAPPDATA\Programs\Git",
  "$env:LOCALAPPDATA\Programs\Microsoft VS Code\resources\app\extensions\git",
  "$env:APPDATA\local\programs\git",
  "D:\Git",
  "D:\tools\git",
  "$env:USERPROFILE\scoop\shims",
  "C:\ProgramData\chocolatey\bin"
) | ForEach-Object {
  if (Test-Path $_) { "DIR EXISTS: $_" | Out-File $out -Append }
}

# Try where.exe with expanded search
$env:PATH = "$env:PATH;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
$g2 = Get-Command git -ErrorAction SilentlyContinue
if ($g2) { "Found after PATH expand: $($g2.Source)" | Out-File $out -Append }

"Done" | Out-File $out -Append
