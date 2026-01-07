# Firebase Hosting 배포 단계별 가이드

## 1단계: Firebase 로그인

터미널에서 다음 명령어를 실행하세요:

```bash
firebase login
```

브라우저가 열리면 Google 계정으로 로그인하세요.

---

## 2단계: Firebase 프로젝트 초기화

```bash
firebase init hosting
```

질문에 다음과 같이 답변하세요:

1. **Use an existing project?** → `Y` (예)
2. **Select a default Firebase project for this directory:** → `management-9f7d8` 선택
3. **What do you want to use as your public directory?** → `dist` 입력
4. **Configure as a single-page app (rewrite all urls to /index.html)?** → `Y` (예)
5. **Set up automatic builds and deploys with GitHub?** → `N` (아니오)
6. **File dist/index.html already exists. Overwrite?** → `N` (아니오)

---

## 3단계: 프로젝트 빌드

```bash
npm run build
```

또는

```bash
npx vite build
```

---

## 4단계: 배포

```bash
firebase deploy --only hosting
```

---

## 배포 완료 후

배포가 완료되면 다음과 같은 주소가 표시됩니다:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/management-9f7d8/overview
Hosting URL: https://management-9f7d8.web.app
```

**인터넷 주소**: `https://management-9f7d8.web.app`

이 주소로 어디서든 접속할 수 있습니다!

---

## 문제 해결

### 빌드 오류가 발생하면:
```bash
npm install
npm run build
```

### Firebase 로그인이 안 되면:
```bash
firebase logout
firebase login
```

### 배포 오류가 발생하면:
Firebase Console에서 Hosting이 활성화되어 있는지 확인하세요.
