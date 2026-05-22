# push-isDummyUrl-fix.ps1
# example.rakuten.co.jp CTAを非表示にするfixをpushするスクリプト
# 実行方法: PowerShellで .\tmp\push-isDummyUrl-fix.ps1

Set-Location "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"

Write-Host "=== Removing stale git lock files ===" -ForegroundColor Yellow
Remove-Item -Force ".git\index.lock"      -ErrorAction SilentlyContinue
Remove-Item -Force ".git\refs\heads\main.lock" -ErrorAction SilentlyContinue

Write-Host "=== git status ===" -ForegroundColor Yellow
git status

Write-Host "=== git add -A ===" -ForegroundColor Yellow
git add -A

$status = git status --porcelain
if ($status) {
    Write-Host "=== git commit ===" -ForegroundColor Yellow
    git commit -m "fix: mark dummy gear links and complete gear set recommendations"
} else {
    Write-Host "Nothing to commit." -ForegroundColor Cyan
}

Write-Host "=== git push origin main ===" -ForegroundColor Yellow
git push origin main

Write-Host "=== Done ===" -ForegroundColor Green
Read-Host "Press Enter to close"
