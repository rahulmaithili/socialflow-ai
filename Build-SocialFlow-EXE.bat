@echo off
title Build SocialFlow AI Windows Installer (.EXE)
color 0b
echo ============================================================
echo   Rahul Scripts - SocialFlow AI Studio (.EXE Installer Builder)
echo ============================================================
echo.
echo [1/3] Navigating to frontend...
cd frontend

echo [2/3] Checking electron-builder dependency...
call npx --yes electron-builder --version

echo [3/3] Building production bundle and packaging Windows installer...
call npm run dist:win

echo.
if exist "dist-electron\SocialFlow AI Studio Setup*.exe" (
    echo ============================================================
    echo   BUILD SUCCESSFUL!
    echo   Installer created in: frontend\dist-electron\
    echo ============================================================
    explorer dist-electron
) else (
    echo Build completed. Check dist-electron folder.
)
pause
