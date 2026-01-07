# KEYCAPS 빠른 시작 가이드

## 📁 폴더 이름 변경

현재 폴더 이름을 `새 폴더`에서 `KEYCAPS`로 변경하세요.

### Windows 탐색기에서:
1. `C:\Users\User\Desktop\새 폴더` 선택
2. F2 키 또는 우클릭 → 이름 바꾸기
3. `KEYCAPS`로 변경

### 명령 프롬프트에서:
```bash
cd C:\Users\User\Desktop
ren "새 폴더" KEYCAPS
cd KEYCAPS
```

## 🚀 GitHub 업로드 (집에서)

### 1. GitHub 저장소 생성
1. [GitHub.com](https://github.com) 로그인
2. `+` → "New repository"
3. 이름: `KEYCAPS`
4. "Create repository" 클릭

### 2. 업로드
```bash
git init
git add .
git commit -m "Initial commit: KEYCAPS"
git branch -M main
git remote add origin https://github.com/your-username/KEYCAPS.git
git push -u origin main
```

## 💼 회사에서 다운로드

```bash
git clone https://github.com/your-username/KEYCAPS.git
cd KEYCAPS
npm install
copy .env.example .env
# .env 파일에 Firebase 설정 입력
npm run dev
```

## 🔄 작업 이어가기

### 집에서 작업 후:
```bash
git add .
git commit -m "작업 내용"
git push origin main
```

### 회사에서 시작 전:
```bash
git pull origin main
npm run dev
```

---

자세한 내용은 `GITHUB_SETUP.md`를 참고하세요!
