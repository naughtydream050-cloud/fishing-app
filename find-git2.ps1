$out = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\git-deep2.txt"
"Scanning..." | Out-File $out
# Check registry for Git install
try {
  $r1 = Get-ItemProperty "HKLM:\SOFTWARE\GitForWindows" -ErrorAction Stop
  "Registry HKLM GitForWindows: $($r1.InstallPath)" | Out-File $out -Append
} catch { "No HKLM registry key" | Out-File $out -Append }
try {
  $r2 = Get-ItemProperty "HKCU:\SOFTWARE\GitForWindows" -ErrorAction Stop
  "Registry HKCU GitForWindows: $($r2.InstallPath)" | Out-File $out -Append
} catch { "No HKCU registry key" | Out-File $out -Append }
# Scoop
if (Test-Path "$env:USERPROFILE\scoop") { "Scoop installed" | Out-File $out -Append }
# Quick FS check
Get-ChildItem "C:\Users\razor\AppData\Local\" -Filter "git*" -ErrorAction SilentlyContinue | Select-Object Name | Out-File $out -Append
Get-ChildItem "C:\Program Files\" -Filter "Git" -ErrorAction SilentlyContinue | Select-Object Name | Out-File $out -Append
"Done" | Out-File $out -Append
