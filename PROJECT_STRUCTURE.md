# KEYCAPS 프로젝트 구조

## 📂 폴더 구조

```
KEYCAPS/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI 설정
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── BOMForm.tsx
│   │   ├── Login.tsx
│   │   ├── OrderListWithTabs.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useInventory.ts # 재고 관리 커스텀 훅
│   ├── utils/
│   │   ├── auth.ts         # 인증 관리 (Firebase)
│   │   ├── storage.ts       # 데이터 저장 (Firebase)
│   │   └── firebase.ts     # Firebase 설정
│   ├── types.ts            # TypeScript 타입 정의
│   ├── App.tsx             # 메인 앱 컴포넌트
│   └── main.tsx            # 진입점
├── .env.example            # 환경 변수 템플릿
├── .gitignore             # Git 제외 파일
├── firebase.json           # Firebase Hosting 설정
├── package.json           # 프로젝트 설정
├── vite.config.ts         # Vite 빌드 설정
├── README.md              # 프로젝트 문서
├── SETUP_GUIDE.md         # 설정 가이드
└── GITHUB_SETUP.md        # GitHub 업로드 가이드
```

## 🔑 중요 파일

### 필수 설정 파일
- `.env` - Firebase 설정 (각 환경에서 생성 필요)
- `.env.example` - 환경 변수 템플릿
- `package.json` - 프로젝트 의존성

### Git 관련
- `.gitignore` - Git에서 제외할 파일 목록
- `.github/workflows/ci.yml` - CI/CD 설정

### 문서
- `README.md` - 프로젝트 개요 및 사용법
- `SETUP_GUIDE.md` - 환경 설정 가이드
- `GITHUB_SETUP.md` - GitHub 업로드 가이드

## ⚠️ 주의사항

1. **`.env` 파일은 절대 커밋하지 마세요!**
   - `.gitignore`에 포함되어 있습니다
   - 각 환경에서 `.env.example`을 복사하여 설정

2. **`node_modules`는 커밋하지 마세요!**
   - 각 환경에서 `npm install` 실행

3. **Firebase 설정**
   - 모든 환경에서 동일한 Firebase 프로젝트 사용
