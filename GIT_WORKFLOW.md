# Git 워크플로우 및 충돌 방지 가이드

## 📋 개요

이 프로젝트는 **Git → GitHub Actions → Firebase** 자동 배포 파이프라인을 사용합니다.

수정 사항을 Git에 푸시하면 자동으로 Firebase에 배포됩니다.

## 🚀 빠른 시작

### 방법 1: 자동 스크립트 사용 (권장)

```bash
# 상세 버전 (충돌 체크 포함)
push-to-git.bat

# 간단 버전 (빠른 업로드)
quick-push.bat
```

### 방법 2: 수동 Git 명령어

```bash
# 1. 변경사항 확인
git status

# 2. 변경사항 추가
git add .

# 3. 커밋
git commit -m "수정 내용 설명"

# 4. 원격 저장소와 동기화 (충돌 방지)
git pull origin main

# 5. 푸시
git push origin main
```

## ⚠️ 충돌 방지 방법

### 1. 작업 전 항상 최신 버전 가져오기

```bash
git pull origin main
```

### 2. 작업 전 브랜치 확인

```bash
# 현재 브랜치 확인
git branch

# main 브랜치로 전환
git checkout main
```

### 3. 충돌이 발생한 경우

#### 상황: `git pull` 시 충돌 발생

```
Auto-merging src/App.tsx
CONFLICT (content): Merge conflict in src/App.tsx
```

#### 해결 방법:

1. **충돌 파일 확인**
   ```bash
   git status
   ```

2. **충돌 파일 열기**
   - 충돌 마커 찾기:
     ```
     <<<<<<< HEAD
     현재 로컬 코드
     =======
     원격 저장소 코드
     >>>>>>> origin/main
     ```

3. **충돌 해결**
   - 두 코드를 비교하여 올바른 코드 선택
   - 충돌 마커(`<<<<<<<`, `=======`, `>>>>>>>`) 모두 제거

4. **해결 완료 표시**
   ```bash
   git add .
   git commit -m "충돌 해결"
   ```

5. **다시 푸시**
   ```bash
   git push origin main
   ```

## 🔄 자동 배포 프로세스

```
로컬 수정
    ↓
git push origin main
    ↓
GitHub 저장소 업데이트
    ↓
GitHub Actions 자동 실행
    ↓
빌드 및 검증
    ↓
Firebase Hosting 자동 배포
    ↓
사이트 업데이트 완료 (약 1-2분)
```

## 📝 작업 흐름 권장사항

### ✅ 좋은 습관

1. **작업 전 항상 pull**
   ```bash
   git pull origin main
   ```

2. **작은 단위로 커밋**
   - 한 번에 너무 많은 변경사항을 커밋하지 않기
   - 의미 있는 단위로 나누기

3. **명확한 커밋 메시지**
   ```
   좋은 예: "재고 관리 테이블 UI 개선"
   나쁜 예: "수정"
   ```

4. **푸시 전 로컬 테스트**
   ```bash
   npm run build
   ```

### ❌ 피해야 할 것

1. **동시에 같은 파일 수정**
   - 가능하면 작업 전에 팀원과 소통

2. **충돌 무시하고 강제 푸시**
   ```bash
   # 절대 사용하지 마세요!
   git push --force
   ```

3. **직접 Firebase에 배포**
   - Git을 통하지 않고 직접 배포하면 충돌 발생 가능

## 🔍 문제 해결

### 문제 1: 푸시가 안 될 때

**증상**: `git push` 시 인증 오류

**해결**:
1. GitHub Personal Access Token 확인
2. SSH 키 설정 확인
3. `git remote -v` 로 원격 저장소 URL 확인

### 문제 2: 배포가 안 될 때

**증상**: GitHub에 푸시했지만 Firebase에 반영 안 됨

**해결**:
1. GitHub 저장소 → Actions 탭 확인
2. 실패한 워크플로우 로그 확인
3. Firebase Service Account 시크릿 확인

### 문제 3: 빌드 실패

**증상**: GitHub Actions에서 빌드 실패

**해결**:
1. 로컬에서 빌드 테스트:
   ```bash
   npm run build
   ```
2. TypeScript 오류 확인:
   ```bash
   npm run build:check
   ```
3. 오류 수정 후 다시 푸시

## 📊 배포 상태 확인

### GitHub Actions 확인
1. GitHub 저장소 접속
2. `Actions` 탭 클릭
3. 최근 워크플로우 실행 상태 확인

### Firebase 배포 확인
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. Hosting 탭에서 배포 내역 확인

## 🛠️ 유용한 Git 명령어

```bash
# 현재 상태 확인
git status

# 변경사항 확인
git diff

# 커밋 히스토리 확인
git log --oneline

# 원격 저장소 확인
git remote -v

# 원격 브랜치 확인
git branch -r

# 최신 변경사항 가져오기 (병합 없이)
git fetch origin

# 특정 커밋으로 되돌리기 (주의!)
git reset --hard <commit-hash>
```

## 📞 추가 도움말

- Git 공식 문서: https://git-scm.com/doc
- GitHub Actions 문서: https://docs.github.com/actions
- Firebase Hosting 문서: https://firebase.google.com/docs/hosting

---

**중요**: 항상 `push-to-git.bat` 스크립트를 사용하면 자동으로 충돌을 체크하고 안전하게 푸시할 수 있습니다!
