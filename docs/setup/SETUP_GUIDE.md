# KEYCAPS 프로젝트 설정 가이드

## 🏠 집에서 작업 후 회사에서 이어가기

### 1단계: GitHub에 업로드 (집에서)

#### GitHub 저장소 생성
1. [GitHub](https://github.com)에 로그인
2. "New repository" 클릭
3. Repository name: `KEYCAPS` (또는 원하는 이름)
4. Public 또는 Private 선택
5. "Create repository" 클릭

#### 로컬에서 Git 초기화 및 업로드

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: KEYCAPS 재고 관리 시스템"

# GitHub 저장소 연결 (위에서 생성한 저장소 URL 사용)
git remote add origin https://github.com/your-username/KEYCAPS.git

# 메인 브랜치로 설정
git branch -M main

# 업로드
git push -u origin main
```

### 2단계: 회사에서 다운로드 및 설정

#### 저장소 클론

```bash
git clone https://github.com/your-username/KEYCAPS.git
cd KEYCAPS
```

#### 의존성 설치

```bash
npm install
```

#### 환경 변수 설정

`.env` 파일을 생성하고 Firebase 설정 정보를 입력하세요.

`.env` 파일을 열고 Firebase 설정 정보를 입력하세요.
(집에서 사용한 것과 동일한 Firebase 프로젝트 사용)

#### 개발 서버 실행

```bash
npm run dev
```

### 3단계: 작업 이어가기

#### 변경사항 가져오기 (회사에서)

```bash
git pull origin main
```

#### 변경사항 업로드 (집에서)

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "변경사항 설명"

# 업로드
git push origin main
```

## 🔄 작업 흐름

### 일반적인 작업 흐름

1. **작업 시작 전**
   ```bash
   git pull origin main  # 최신 변경사항 가져오기
   ```

2. **작업 중**
   - 파일 수정
   - 테스트

3. **작업 완료 후**
   ```bash
   git add .
   git commit -m "작업 내용 설명"
   git push origin main
   ```

### 브랜치 사용 (선택사항)

새 기능 개발 시:

```bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 작업 후 커밋
git add .
git commit -m "새 기능 추가"

# 브랜치 업로드
git push origin feature/new-feature

# GitHub에서 Pull Request 생성
```

## ⚠️ 주의사항

1. **`.env` 파일은 절대 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있습니다
   - 각 환경에서 `.env`를 직접 생성하여 설정하세요

2. **`node_modules`는 커밋하지 마세요**
   - `.gitignore`에 포함되어 있습니다
   - 각 환경에서 `npm install` 실행

3. **Firebase 설정**
   - 모든 환경에서 동일한 Firebase 프로젝트를 사용하세요
   - Firebase Console에서 설정 정보 확인

## 🛠️ 문제 해결

### Git 충돌 해결

```bash
# 충돌 발생 시
git pull origin main

# 충돌 파일 수정 후
git add .
git commit -m "충돌 해결"
git push origin main
```

### 변경사항 되돌리기

```bash
# 마지막 커밋 취소 (로컬만)
git reset --soft HEAD~1

# 특정 파일만 되돌리기
git checkout -- 파일명
```

### 원격 저장소와 동기화

```bash
# 원격 저장소 상태 확인
git fetch origin

# 원격과 로컬 비교
git status

# 강제 동기화 (주의!)
git pull --rebase origin main
```

## 📚 유용한 Git 명령어

```bash
# 상태 확인
git status

# 변경사항 확인
git diff

# 커밋 히스토리
git log

# 브랜치 목록
git branch

# 원격 저장소 확인
git remote -v
```

---

**팁**: 매일 작업 시작 전에 `git pull`을 실행하여 최신 변경사항을 가져오세요!
