$out = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\git-check2.txt"
$paths = @(
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\git.exe",
    "C:\Program Files\Git\cmd\git.exe"
)
$found = $false
foreach ($p in $paths) {
    if (Test-Path $p) { "FOUND: $p" | Out-File $out; $found = $true; break }
}
if (-not $found) { "NOT YET INSTALLED" | Out-File $out }
