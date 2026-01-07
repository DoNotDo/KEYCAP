@echo off
chcp 65001 >nul
echo ====================================
echo 개발 서버 시작 중...
echo ====================================
echo.

cd /d "%~dp0"

echo 현재 디렉토리:
cd
echo.

echo Node.js 버전 확인:
node --version
echo.

echo npm 패키지 확인 중...
if not exist "node_modules" (
    echo node_modules 폴더가 없습니다. npm install을 실행합니다...
    call npm install
    echo.
)

echo 개발 서버 시작...
echo.
echo 브라우저에서 http://localhost:5173 으로 접속하세요
echo.
echo 종료하려면 Ctrl+C를 누르세요
echo ====================================
echo.

call npm run dev

pause
