# 🚀 빠른 배포 가이드

인터넷 주소로 접속하려면 다음 중 하나의 방법을 사용하세요:

## 방법 1: Vercel (가장 빠름, 추천) ⭐

### 단계:
1. [Vercel.com](https://vercel.com) 접속
2. GitHub로 로그인 (또는 이메일로 가입)
3. "Add New Project" 클릭
4. GitHub 저장소 연결 (또는 직접 업로드)
5. 프로젝트 설정:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. "Deploy" 클릭

**결과**: `https://your-project-name.vercel.app` 주소가 생성됩니다!

---

## 방법 2: Firebase Hosting (이미 Firebase 사용 중)

### 단계:
1. 터미널에서 실행:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

2. 질문에 답변:
   - Use an existing project: **Y**
   - Select: **management-9f7d8**
   - Public directory: **dist**
   - Single-page app: **Y**

3. 빌드 및 배포:
```bash
npm run build
firebase deploy --only hosting
```

**결과**: `https://management-9f7d8.web.app` 주소가 생성됩니다!

---

## 방법 3: Netlify

### 단계:
1. [Netlify.com](https://netlify.com) 접속
2. "Add new site" → "Deploy manually"
3. `dist` 폴더를 드래그 앤 드롭

**결과**: `https://your-project-name.netlify.app` 주소가 생성됩니다!

---

## 가장 빠른 방법 (Vercel CLI)

터미널에서:
```bash
npm install -g vercel
vercel
```

질문에 답변하면 자동으로 배포됩니다!

---

## 배포 후 주소

배포가 완료되면 다음과 같은 형식의 주소가 제공됩니다:
- Vercel: `https://your-project.vercel.app`
- Firebase: `https://management-9f7d8.web.app`
- Netlify: `https://your-project.netlify.app`

이 주소를 다른 PC나 모바일에서도 접속할 수 있습니다!
