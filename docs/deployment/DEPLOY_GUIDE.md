# 인터넷 주소로 배포하기

## 방법 1: Firebase Hosting (권장 - 이미 Firebase 사용 중)

### 1단계: Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2단계: Firebase 로그인
```bash
firebase login
```

### 3단계: Firebase 프로젝트 초기화
```bash
firebase init hosting
```
질문에 답변:
- Use an existing project: **Y**
- Select a project: **management-9f7d8** 선택
- What do you want to use as your public directory? **dist**
- Configure as a single-page app: **Y**
- Set up automatic builds and deploys with GitHub? **N**

### 4단계: 빌드
```bash
npm run build
```

### 5단계: 배포
```bash
firebase deploy --only hosting
```

배포가 완료되면 다음과 같은 주소가 제공됩니다:
```
https://management-9f7d8.web.app
또는
https://management-9f7d8.firebaseapp.com
```

---

## 방법 2: Vercel (더 간단함)

### 1단계: Vercel CLI 설치
```bash
npm install -g vercel
```

### 2단계: 배포
```bash
vercel
```

질문에 답변:
- Set up and deploy? **Y**
- Which scope? (기본값 사용)
- Link to existing project? **N**
- What's your project's name? (기본값 사용)
- In which directory is your code located? **./**
- Want to override the settings? **N**

배포가 완료되면 다음과 같은 주소가 제공됩니다:
```
https://your-project-name.vercel.app
```

### 자동 배포 설정 (선택사항)
GitHub에 코드를 푸시하면 자동으로 배포됩니다.

---

## 방법 3: Netlify

### 1단계: Netlify CLI 설치
```bash
npm install -g netlify-cli
```

### 2단계: 로그인
```bash
netlify login
```

### 3단계: 빌드 및 배포
```bash
npm run build
netlify deploy --prod --dir=dist
```

배포가 완료되면 다음과 같은 주소가 제공됩니다:
```
https://your-project-name.netlify.app
```

---

## 빠른 배포 (Vercel 추천)

가장 빠르고 간단한 방법:

```bash
# 1. Vercel 설치
npm install -g vercel

# 2. 배포
vercel

# 3. 프로덕션 배포
vercel --prod
```

---

## 주의사항

1. **환경 변수**: `.env` 파일의 Firebase 설정이 올바른지 확인하세요.
2. **빌드**: 배포 전에 `npm run build`로 빌드가 성공하는지 확인하세요.
3. **도메인**: 배포 후 제공되는 주소를 사용하거나, 커스텀 도메인을 연결할 수 있습니다.
