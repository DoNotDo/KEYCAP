# 🚀 배포 옵션 가이드

## 현실적인 배포 방법 비교

### 1. **Vercel (가장 추천 ⭐⭐⭐)**
**장점:**
- ✅ GitHub 연동으로 자동 배포 (코드 푸시하면 자동 배포)
- ✅ 무료 플랜 제공
- ✅ 설정이 매우 간단
- ✅ 커스텀 도메인 지원
- ✅ 빠른 CDN

**단계:**
1. GitHub에 코드 업로드
2. [vercel.com](https://vercel.com) 접속 → GitHub로 로그인
3. "Add New Project" → GitHub 저장소 선택
4. 자동으로 감지되어 배포됨!

**결과:** `https://your-project.vercel.app`

---

### 2. **Firebase Hosting (현재 사용 중 ⭐⭐)**
**장점:**
- ✅ 이미 Firebase 사용 중이므로 통합 관리 가능
- ✅ 무료 플랜 제공
- ✅ 커스텀 도메인 지원

**단계:**
```bash
# 1. 빌드
npm run build

# 2. 배포
firebase deploy --only hosting
```

**결과:** `https://management-9f7d8.web.app`

---

### 3. **Netlify (GitHub 연동 ⭐⭐)**
**장점:**
- ✅ GitHub 연동으로 자동 배포
- ✅ 무료 플랜 제공
- ✅ 설정 간단

**단계:**
1. GitHub에 코드 업로드
2. [netlify.com](https://netlify.com) 접속 → GitHub로 로그인
3. "Add new site" → GitHub 저장소 선택
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

**결과:** `https://your-project.netlify.app`

---

### 4. **GitHub Pages (제한적 ⚠️)**
**장점:**
- ✅ 완전 무료
- ✅ GitHub과 통합

**단점:**
- ❌ SPA 라우팅 설정 복잡
- ❌ 빌드 자동화 설정 필요
- ❌ Firebase와 호환성 이슈 가능

---

## 🎯 추천 방법: Vercel + GitHub

### 이유:
1. **가장 간단**: GitHub에 올리기만 하면 자동 배포
2. **자동 업데이트**: 코드 수정 후 푸시하면 자동으로 새 버전 배포
3. **무료**: 충분한 무료 플랜 제공
4. **빠름**: 전 세계 CDN으로 빠른 속도

---

## 📋 GitHub에 올리는 방법

### 1단계: GitHub 저장소 생성
1. [github.com](https://github.com) 접속
2. "New repository" 클릭
3. 저장소 이름: `KEYCAPS` (또는 원하는 이름)
4. "Create repository" 클릭

### 2단계: 로컬에서 Git 초기화
```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit"

# GitHub 저장소 연결 (위에서 만든 저장소 URL 사용)
git remote add origin https://github.com/your-username/KEYCAPS.git

# 푸시
git branch -M main
git push -u origin main
```

### 3단계: Vercel에 연결
1. [vercel.com](https://vercel.com) 접속
2. GitHub로 로그인
3. "Add New Project"
4. 방금 만든 GitHub 저장소 선택
5. 자동으로 설정 감지됨 → "Deploy" 클릭

**완료!** 몇 분 후 `https://your-project.vercel.app` 주소로 접속 가능!

---

## 🔄 자동 배포 설정

### Vercel/Netlify 사용 시:
- ✅ GitHub에 코드 푸시하면 **자동으로 배포됨**
- ✅ Pull Request 생성하면 미리보기 URL 제공
- ✅ 별도 설정 불필요

### Firebase Hosting 사용 시:
- ❌ 수동 배포 필요 (`firebase deploy`)
- ✅ GitHub Actions로 자동화 가능 (추가 설정 필요)

---

## 💡 최종 추천

**가장 현실적인 방법:**
1. **GitHub에 코드 업로드** (버전 관리 + 백업)
2. **Vercel에 연결** (자동 배포)
3. **결과**: 코드 수정 → GitHub 푸시 → 자동 배포 ✨

이 방법이 가장 현실적이고 관리하기 쉽습니다!
