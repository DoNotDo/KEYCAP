@echo off
chcp 65001 >nul
echo ========================================
echo   KEYCAP 프로젝트 Git 업로드 스크립트
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

:: 현재 브랜치 확인
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 현재 브랜치: %CURRENT_BRANCH%
echo.

:: 변경사항 확인
git status --short
if errorlevel 1 (
    echo ❌ Git 상태 확인 실패
    pause
    exit /b 1
)

:: 변경사항이 있는지 확인
git diff --quiet && git diff --cached --quiet
set HAS_CHANGES=%errorlevel%

:: 로컬 커밋이 원격보다 앞서 있는지 확인
git rev-list --count origin/%CURRENT_BRANCH%..HEAD >nul 2>&1
set AHEAD=%errorlevel%

if %HAS_CHANGES% neq 0 (
    echo.
    echo 변경사항이 감지되었습니다.
    echo.
    
    :: 커밋 메시지 입력
    set /p COMMIT_MSG="커밋 메시지를 입력하세요: "
    if "!COMMIT_MSG!"=="" (
        echo ❌ 커밋 메시지가 비어있습니다.
        pause
        exit /b 1
    )
    
    echo.
    echo 변경사항을 스테이징합니다...
    git add .
    
    echo.
    echo 커밋을 생성합니다...
    git commit -m "!COMMIT_MSG!"
    
    if errorlevel 1 (
        echo ❌ 커밋 실패
        pause
        exit /b 1
    )
    
    echo ✅ 커밋 완료
    echo.
) else (
    if %AHEAD% equ 0 (
        echo 변경사항이 없습니다.
        echo.
    ) else (
        echo 로컬에 커밋된 변경사항이 있습니다.
        echo.
    )
)

:: 원격 저장소 확인
git remote -v | findstr /C:"origin" >nul
if errorlevel 1 (
    echo ❌ 원격 저장소(origin)가 설정되지 않았습니다.
    echo.
    set /p REMOTE_URL="원격 저장소 URL을 입력하세요: "
    if "!REMOTE_URL!"=="" (
        echo ❌ URL이 비어있습니다.
        pause
        exit /b 1
    )
    git remote add origin "!REMOTE_URL!"
    echo ✅ 원격 저장소 추가 완료
    echo.
)

:: 원격 브랜치 확인 및 pull
echo 원격 저장소에서 최신 변경사항을 가져옵니다...
git fetch origin

:: 원격 브랜치가 있는지 확인
git ls-remote --heads origin %CURRENT_BRANCH% >nul 2>&1
if errorlevel 1 (
    echo 원격에 %CURRENT_BRANCH% 브랜치가 없습니다. 새로 생성합니다.
) else (
    echo 원격 브랜치와 동기화 중...
    git pull origin %CURRENT_BRANCH% --no-edit
    
    if errorlevel 1 (
        echo.
        echo ⚠️  충돌이 발생했습니다!
        echo.
        echo 충돌을 해결한 후 다시 실행하세요.
        echo.
        echo 충돌 해결 방법:
        echo 1. 충돌이 발생한 파일을 열어서 수정
        echo 2. git add . 로 충돌 해결 표시
        echo 3. git commit 으로 병합 커밋 생성
        echo 4. 이 스크립트를 다시 실행
        echo.
        pause
        exit /b 1
    )
    echo ✅ 동기화 완료
    echo.
)

:: Push
echo.
echo GitHub에 푸시합니다...
echo.
git push origin %CURRENT_BRANCH%

if errorlevel 1 (
    echo.
    echo ❌ 푸시 실패
    echo.
    echo 가능한 원인:
    echo - 네트워크 연결 문제
    echo - 인증 문제 (토큰 또는 SSH 키 확인)
    echo - 권한 문제
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Git 업로드 완료!
echo ========================================
echo.
echo GitHub Actions가 자동으로 Firebase에 배포합니다.
echo 배포 상태는 GitHub 저장소의 Actions 탭에서 확인할 수 있습니다.
echo.
echo 잠시 후 Firebase 사이트에서 변경사항을 확인하세요.
echo.
pause
