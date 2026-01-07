# GitHub 업로드 가이드

## 1단계: 폴더 이름 변경

현재 폴더 이름을 `새 폴더`에서 `KEYCAPS`로 변경하세요:

**Windows 탐색기에서:**
1. `C:\Users\User\Desktop\새 폴더` 폴더 선택
2. F2 키 누르거나 우클릭 → 이름 바꾸기
3. `KEYCAPS`로 변경

**또는 명령 프롬프트에서:**
```bash
cd C:\Users\User\Desktop
ren "새 폴더" KEYCAPS
cd KEYCAPS
```

## 2단계: GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단 `+` 아이콘 → "New repository" 클릭
3. Repository name: `KEYCAPS`
4. Description: "실시간 재고 관리 시스템"
5. Public 또는 Private 선택
6. **"Initialize this repository with a README" 체크 해제** (이미 README.md가 있음)
7. "Create repository" 클릭

## 3단계: Git 초기화 및 업로드

프로젝트 폴더에서 다음 명령어 실행:

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

**참고**: `your-username`을 본인의 GitHub 사용자명으로 변경하세요.

## 4단계: 회사에서 다운로드

회사 컴퓨터에서:

```bash
# 저장소 클론
git clone https://github.com/your-username/KEYCAPS.git

# 폴더로 이동
cd KEYCAPS

# 의존성 설치
npm install

# 환경 변수 설정
copy .env.example .env
# (또는 PowerShell에서: Copy-Item .env.example .env)

# .env 파일을 열고 Firebase 설정 정보 입력

# 개발 서버 실행
npm run dev
```

## 5단계: 작업 이어가기

### 집에서 작업 후 업로드

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "작업 내용 설명"

# 업로드
git push origin main
```

### 회사에서 최신 버전 가져오기

```bash
# 최신 변경사항 가져오기
git pull origin main

# 개발 서버 실행
npm run dev
```

## ⚠️ 중요 사항

1. **`.env` 파일은 절대 커밋하지 마세요!**
   - `.gitignore`에 이미 포함되어 있습니다
   - 각 환경에서 `.env.example`을 복사하여 설정하세요

2. **`node_modules`는 커밋하지 마세요!**
   - 각 환경에서 `npm install` 실행

3. **Firebase 설정**
   - 모든 환경에서 동일한 Firebase 프로젝트 사용
   - Firebase Console에서 설정 정보 확인

## 🔄 일반적인 작업 흐름

### 매일 작업 시작 시

```bash
git pull origin main  # 최신 변경사항 가져오기
npm run dev          # 개발 서버 실행
```

### 작업 완료 후

```bash
git add .
git commit -m "변경사항 설명"
git push origin main
```

## 📝 유용한 Git 명령어

```bash
# 상태 확인
git status

# 변경사항 확인
git diff

# 커밋 히스토리
git log --oneline

# 특정 파일만 커밋
git add src/components/BOMForm.tsx
git commit -m "BOMForm에 카테고리 표시 추가"
```

---

**팁**: 매일 작업 시작 전에 `git pull`을 실행하여 최신 버전을 가져오세요!
