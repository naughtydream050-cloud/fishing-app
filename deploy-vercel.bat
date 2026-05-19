@echo off
chcp 65001 >nul
cd /d "D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app"
echo === Vercel Deploy ===
vercel deploy --prod --yes > deploy.log 2>&1
echo =