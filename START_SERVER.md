# 개발 서버 실행 방법

## 방법 1: 배치 파일 사용 (가장 쉬움) ⭐

프로젝트 폴더에서 `start-server.bat` 파일을 **더블클릭**하세요!

---

## 방법 2: 명령 프롬프트(CMD)에서 실행

1. 프로젝트 폴더에서 **Shift + 우클릭** → "여기서 PowerShell 창 열기" 또는 "터미널 열기"
2. 다음 명령어 실행:
```bash
npm run dev
```

---

## 방법 3: 다른 포트 사용

5173 포트에 문제가 있으면 다른 포트를 사용하세요:

```bash
npx vite --port 3000
```

그 다음 http://localhost:3000 으로 접속하세요.

---

## 접속 주소

서버가 시작되면 다음 주소로 접속하세요:

- **로컬 주소**: http://localhost:5173
- **또는**: http://127.0.0.1:5173

---

## 문제 해결

### "npm run dev"가 실행되지 않을 때
```bash
npm install
npm run dev
```

### 포트가 이미 사용 중일 때
다른 포트 사용:
```bash
npx vite --port 3000
```

### 여전히 404 오류가 발생할 때
1. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)
2. 시크릿 모드로 접속
3. 다른 브라우저로 시도

---

## 서버가 시작되면

터미널에 다음과 같은 메시지가 표시됩니다:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

이 메시지가 보이면 정상적으로 시작된 것입니다!
