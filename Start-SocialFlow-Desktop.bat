@echo off
title SocialFlow AI - Desktop Studio
color 0a
echo ============================================================
echo     SocialFlow AI - Desktop Content & Growth Studio
echo ============================================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules\" (
    echo [*] Installing dependencies, please wait...
    call npm install
)

if not exist "dist\" (
    echo [*] Compiling app bundle...
    call npm run build
)

echo [*] Launching Desktop Application...
echo [*] Multi-Account Vault, In-App Browser, AI Studio & Analytics Ready!
echo.
echo Keep this window open while using the app.
echo.

call npm run electron:dev

pause
