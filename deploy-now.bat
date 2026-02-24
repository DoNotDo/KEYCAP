@echo off
chcp 65001 >nul
echo ========================================
echo   사이트 바로 반영 (main 푸시 + 배포)
echo ========================================
echo.

cd /d "%~dp0"

:: Git 저장소 확인
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ 오류: Git 저장소가 아닙니다.
    pause
    exit /b 1
)

:: 현재 브랜치
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT=%%i
if "%CURRENT%"=="" (
    echo ❌ 현재 브랜치를 알 수 없습니다.
    pause
    exit /b 1
)
echo 현재 브랜치: %CURRENT%
echo.

:: 변경사항 스테이징 및 커밋 (자동 메시지)
set COMMIT_MSG=사이트 업데이트
git add .
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%COMMIT_MSG%"
    if errorlevel 1 (
        echo ❌ 커밋 실패
        pause
        exit /b 1
    )
    echo ✅ 커밋 완료
) else (
    git diff --quiet
    if errorlevel 1 (
        git commit -m "%COMMIT_MSG%"
        if errorlevel 1 (
            echo ❌ 커밋 실패
            pause
            exit /b 1
        )
        echo ✅ 커밋 완료
    ) else (
        echo 변경사항 없음 - 기존 커밋만 푸시합니다.
    )
)
echo.

:: main이면 main만 푸시, 아니면 현재 브랜치를 main에 머지 후 푸시
if "%CURRENT%"=="main" (
    echo main 브랜치 → 원격 동기화 후 푸시...
    git pull origin main --no-edit
    if errorlevel 1 (
        echo ⚠️ pull 충돌. 수동으로 해결 후 다시 실행하세요.
        pause
        exit /b 1
    )
    git push origin main
) else (
    echo %CURRENT% 브랜치 → main에 반영 후 푸시...
    git push origin %CURRENT% 2>nul
    git fetch origin
    git checkout main
    git pull origin main --no-edit
    if errorlevel 1 (
        echo ⚠️ main pull 충돌. 수동 해결 후 다시 실행하세요.
        git checkout %CURRENT%
        pause
        exit /b 1
    )
    git merge %CURRENT% --no-edit
    if errorlevel 1 (
        echo ⚠️ 머지 충돌. 수동 해결 후 main에서 push 하세요.
        git checkout %CURRENT%
        pause
        exit /b 1
    )
    git push origin main
    if errorlevel 1 (
        echo ❌ main 푸시 실패
        git checkout %CURRENT%
        pause
        exit /b 1
    )
    git checkout %CURRENT%
)
if errorlevel 1 (
    echo ❌ 푸시 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ KEYCAP 원격 저장소에 자동 푸시 완료
echo ========================================
echo.
echo 1~2분 후 사이트에 반영됩니다.
echo   https://management-9f7d8.web.app
echo.
echo 배포 상태: GitHub 저장소 → Actions 탭
echo.
echo 아무 키나 누르면 종료합니다.
pause >nul
