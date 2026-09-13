@echo off
title SocialFlow AI - Web Browser Mode
color 0b
echo ============================================================
echo     SocialFlow AI - Web Browser Mode
echo ============================================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules\" (
    echo [*] Installing dependencies, please wait...
    call npm install
)

echo [*] Launching Web Server...
start "" "http://localhost:5173"
call npm run dev

pause
