$out = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\scoop-git-check.txt"
$paths = @(
    "$env:USERPROFILE\scoop\shims\git.exe",
    "$env:USERPROFILE\scoop\apps\git\current\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "C:\Program Files\Git\cmd\git.exe"
)
$found = $false
foreach ($p in $paths) {
    if (Test-Path $p) { "FOUND: $p" | Out-File $out; $found = $true }
}
if (-not $found) { "NOT INSTALLED" | Out-File $out }
# Also check if scoop itself installed
if (Test-Path "$env:USERPROFILE\scoop") { "Scoop dir exists" | Out-File $out -Append }
else { "Scoop dir NOT found" | Out-File $out -Append }
