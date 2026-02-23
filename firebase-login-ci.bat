@echo off
chcp 65001 >nul
echo Firebase 로그인 (CI 토큰 발급)
echo.
echo 브라우저가 열리면 Google 계정으로 로그인하세요.
echo 로그인 후 터미널에 나온 긴 토큰을 복사해
echo GitHub Settings ^> Secrets ^> FIREBASE_TOKEN 에 붙여넣으면 됩니다.
echo.
cd /d "%~dp0"
call npx firebase login:ci
echo.
pause
