@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting development server...
echo.
npm run dev
pause
