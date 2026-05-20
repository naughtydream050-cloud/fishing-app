# Check git location
$out = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\git-found.txt"
"=== Git Search ===" | Out-File $out
"PATH entries:" | Out-File $out -Append
$env:PATH -split ";" | Out-File $out -Append
"" | Out-File $out -Append
$g = Get-Command git -ErrorAction SilentlyContinue
if ($g) { "FOUND git: $($g.Source)" | Out-File $out -Append }
else { "git NOT in PATH" | Out-File $out -Append }
# Check common locations
@(
  "C:\Program Files\Git\cmd\git.exe",
  "C:\Program Files (x86)\Git\cmd\git.exe",
  "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
  "$env:LOCALAPPDATA\SourceTree\git_local\cmd\git.exe"
) | ForEach-Object {
  if (Test-Path $_) { "EXISTS: $_" | Out-File $out -Append }
}
"Done." | Out-File $out -Append
