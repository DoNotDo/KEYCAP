@echo off
chcp 65001 >nul
echo ========================================
echo   빠른 Git 업로드 (간단 버전)
echo ========================================
echo.

cd /d "%~dp0"

:: 커밋 메시지 입력
set /p COMMIT_MSG="커밋 메시지: "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update

:: Git 작업
git add .
git commit -m "%COMMIT_MSG%"

:: 현재 브랜치 확인
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i

:: Pull (충돌 방지)
echo.
echo 원격 저장소와 동기화 중...
git pull origin %BRANCH% --no-edit 2>nul

:: Push
echo.
echo GitHub에 푸시 중...
git push origin %BRANCH%

if errorlevel 1 (
    echo.
    echo ❌ 푸시 실패 - push-to-git.bat을 사용하세요
    pause
) else (
    echo.
    echo ✅ 완료! Firebase 자동 배포 중...
)
