@echo off
setlocal enabledelayedexpansion

REM Ensure we are in the script's directory
cd /d "%~dp0"

echo ==================================================
echo Launching INOS Clean Boot...
echo ==================================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\start-inos-clean.ps1" %*

echo.
echo ==================================================
echo Boot process complete. Press any key to exit.
echo ==================================================
pause >nul
