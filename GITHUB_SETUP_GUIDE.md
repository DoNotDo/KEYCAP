# 📦 GitHub에 프로젝트 올리기 - 단계별 가이드

## 1단계: GitHub 저장소 생성

1. [github.com](https://github.com) 접속
2. 우측 상단 "+" → "New repository" 클릭
3. 저장소 정보 입력:
   - **Repository name**: `KEYCAPS` (또는 원하는 이름)
   - **Description**: `실시간 재고 관리 시스템`
   - **Public** 또는 **Private** 선택
   - ⚠️ **"Initialize this repository with a README" 체크 해제** (이미 파일이 있으므로)
4. "Create repository" 클릭

---

## 2단계: 로컬에서 Git 설정

### Git이 설치되어 있는지 확인
```bash
git --version
```

설치되어 있지 않다면: [git-scm.com](https://git-scm.com)에서 다운로드

### 프로젝트 폴더에서 실행

```bash
# 현재 폴더로 이동 (이미 KEYCAPS 폴더에 있다면 생략)
cd C:\Users\User\Desktop\KEYCAPS

# Git 초기화 (처음 한 번만)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: KEYCAPS 재고 관리 시스템"

# GitHub 저장소 연결
# ⚠️ 아래 URL을 위에서 만든 저장소 URL로 변경하세요!
git remote add origin https://github.com/your-username/KEYCAPS.git

# 메인 브랜치로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

---

## 3단계: GitHub 저장소 URL 확인

GitHub 저장소 페이지에서:
- 초록색 "Code" 버튼 클릭
- HTTPS URL 복사 (예: `https://github.com/your-username/KEYCAPS.git`)
- 위의 `git remote add origin` 명령어에 사용

---

## 4단계: 인증 (필요한 경우)

### Personal Access Token 사용 (권장)
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` 체크
4. 생성된 토큰 복사
5. `git push` 시 비밀번호 대신 토큰 입력

### 또는 GitHub Desktop 사용
- [desktop.github.com](https://desktop.github.com) 다운로드
- GUI로 더 쉽게 관리 가능

---

## 5단계: 확인

GitHub 저장소 페이지를 새로고침하면 모든 파일이 업로드된 것을 확인할 수 있습니다!

---

## 🔄 이후 업데이트 방법

코드를 수정한 후:

```bash
# 변경사항 확인
git status

# 변경된 파일 추가
git add .

# 커밋
git commit -m "변경 내용 설명"

# GitHub에 푸시
git push
```

---

## ⚠️ 주의사항

### .gitignore 확인
다음 파일들은 GitHub에 올라가지 않습니다 (보안상 좋음):
- `node_modules/` - 의존성 (npm install로 재설치)
- `.env` - 환경 변수 (Firebase 키 등)
- `dist/` - 빌드 결과물

### Firebase 키 보안
`.env` 파일은 GitHub에 올라가지 않지만, Firebase 설정은 이미 코드에 포함되어 있습니다.
프로덕션 환경에서는 환경 변수로 관리하는 것이 좋습니다.

---

## ✅ 완료!

이제 GitHub에 코드가 올라갔습니다. 다음 단계는 Vercel이나 Netlify에 연결하여 자동 배포를 설정하는 것입니다!
