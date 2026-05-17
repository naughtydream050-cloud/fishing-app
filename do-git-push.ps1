# Push fishing-app to GitHub using explicit GIT_DIR/WORK_TREE
# This avoids picking up the parent D:\Development\.git

$gitExe   = "$env:USERPROFILE\scoop\shims\git.exe"
$repoDir  = "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"
$gitDir   = "$repoDir\.git"
$out      = "$repoDir\push-log.txt"

"[check] git: $gitExe exists=$(Test-Path $gitExe)" | Tee-Object $out

# ── Step 1: global config ──────────────────────────────────────────
"[1] Global git config..." | Tee-Object $out -Append
& $gitExe config --global user.email "naughty19960502@gmail.com"
& $gitExe config --global user.name  "naughtydream050-cloud"
& $gitExe config --global --add safe.directory "*"

# ── Step 2: clean up stale locks ──────────────────────────────────
"[2] Removing stale lock files..." | Tee-Object $out -Append
@(
    "D:\Development\.git\index.lock",
    "D:\Development\.git\config.lock",
    "$gitDir\index.lock",
    "$gitDir\config.lock"
) | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force
        "  Removed: $_" | Tee-Object $out -Append
    }
}

# ── Step 3: remove broken fishing-app .git, re-init cleanly ───────
"[3] Re-initialising fishing-app git repo..." | Tee-Object $out -Append
if (Test-Path $gitDir) {
    Remove-Item $gitDir -Recurse -Force
    "  Removed broken .git" | Tee-Object $out -Append
}

# Force git to use ONLY fishing-app as both git-dir and work-tree
$env:GIT_DIR       = $gitDir
$env:GIT_WORK_TREE = $repoDir

& $gitExe init 2>&1 | Tee-Object $out -Append
& $gitExe config core.autocrlf true  2>&1 | Out-Null

# ── Step 4: set remote ────────────────────────────────────────────
"[4] Setting remote..." | Tee-Object $out -Append
$remoteExists = & $gitExe remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) { & $gitExe remote remove origin 2>&1 | Out-Null }
& $gitExe remote add origin "https://github.com/naughtydream050-cloud/fishing-app.git"
"  Remote: https://github.com/naughtydream050-cloud/fishing-app.git" | Tee-Object $out -Append

# ── Step 5: stage only fishing-app files ─────────────────────────
"[5] Staging files..." | Tee-Object $out -Append
& $gitExe add -A 2>&1 | Out-Null
$count = (& $gitExe status --short 2>&1 | Measure-Object -Line).Lines
"  Staged $count files" | Tee-Object $out -Append

# ── Step 6: commit ────────────────────────────────────────────────
"[6] Committing..." | Tee-Object $out -Append
& $gitExe commit -m "feat: Phase 2 GEO pipeline - deterministic scoring, zero-LLM production" 2>&1 |
    Tee-Object $out -Append

# ── Step 7: push (GCM will open browser for OAuth) ────────────────
"[7] Pushing to GitHub (browser auth may open)..." | Tee-Object $out -Append
& $gitExe push --set-upstream origin master 2>&1 | Tee-Object $out -Append

if ($LASTEXITCODE -eq 0) {
    "[SUCCESS] Pushed to GitHub!" | Tee-Object $out -Append
} else {
    "[PARTIAL] Push may need credentials - check browser window." | Tee-Object $out -Append
}

# clear env vars
Remove-Item Env:\GIT_DIR       -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_WORK_TREE -ErrorAction SilentlyContinue

"Done at $(Get-Date)" | Tee-Object $out -Append
Read-Host "Press Enter to exit"
