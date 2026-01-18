# KEYCAPS - 실시간 재고 관리 시스템

Firebase 기반의 실시간 재고 관리 시스템입니다. 여러 PC에서 동시에 접속하여 실시간으로 데이터를 동기화할 수 있습니다.

## 🚀 주요 기능

- ✅ 완성재고 및 부자재 관리
- ✅ BOM (Bill of Materials) 설정
- ✅ 지점별 주문 관리 및 처리
- ✅ 실시간 데이터 동기화 (Firebase)
- ✅ 사용자 권한 관리 (관리자/직원)
- ✅ 재고 부족 알림
- ✅ 월간/주간 보고서 생성
- ✅ 모바일 반응형 디자인

## 📋 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Firebase 프로젝트 (Firestore Database, Authentication 활성화 필요)

## 🛠️ 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd KEYCAPS
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 Firebase 설정 정보를 입력하세요:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=981753652672
VITE_FIREBASE_APP_ID=1:981753652672:web:9038dadd699022179cd425
```

### 4. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Firestore Database 생성 (테스트 모드)
3. Authentication 활성화 (이메일/비밀번호)
4. 보안 규칙 설정 (개발 중):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // 개발 중
    }
  }
}
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📦 빌드

프로덕션 빌드:

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 🚢 배포

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

### Vercel

```bash
npm install -g vercel
vercel
```

## 👤 기본 계정

- **관리자**: `admin` / `admin123`
- **직원1**: `직원1` / `emp123`
- **직원2**: `직원2` / `emp123`

## 📁 프로젝트 구조

```
KEYCAPS/
├── src/
│   ├── components/      # React 컴포넌트
│   ├── hooks/           # Custom hooks
│   ├── utils/           # 유틸리티 함수
│   │   ├── auth.ts      # 인증 관리
│   │   ├── storage.ts   # 데이터 저장 (Firebase)
│   │   └── firebase.ts  # Firebase 설정
│   ├── types.ts         # TypeScript 타입 정의
│   ├── App.tsx          # 메인 앱 컴포넌트
│   └── main.tsx         # 진입점
├── public/              # 정적 파일
├── .env                # 환경 변수 (로컬에서 생성)
├── .gitignore          # Git 제외 파일
├── package.json        # 프로젝트 설정
├── vite.config.ts      # Vite 설정
└── README.md           # 프로젝트 문서
```

## 🔧 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Backend**: Firebase (Firestore, Authentication)
- **UI Icons**: Lucide React
- **State Management**: React Hooks

## 📝 주요 기능 설명

### 재고 관리
- 완성재고와 부자재를 분리하여 관리
- 재고 입출고 내역 추적
- 재고 부족 알림

### BOM 관리
- 완성재고 생산에 필요한 부자재 설정
- 카테고리별 부자재 선택

### 주문 처리
- 지점별 주문 관리
- 주문 상태 추적 (대기 → 처리중 → 출고 → 입고 → 완료)
- 출고 시 자동으로 부자재 소모 계산

### 실시간 동기화
- Firebase Firestore를 통한 실시간 데이터 동기화
- 여러 사용자가 동시에 작업 가능
- 브라우저 캐시 삭제해도 데이터 유지

## 🐛 문제 해결

### 로그인이 안 될 때
- Firebase Console에서 Authentication이 활성화되어 있는지 확인
- Firestore 보안 규칙 확인
- 브라우저 콘솔(F12)에서 오류 확인

### 데이터가 보이지 않을 때
- Firebase Console에서 Firestore Database 확인
- `.env` 파일의 설정이 올바른지 확인
- Firebase 환경 변수 값이 정상인지 확인

### 빌드 오류
```bash
npm install
npm run build
```

## 📄 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.

## 📚 추가 문서

자세한 가이드는 다음 문서를 참고하세요:

- **[설정 가이드](docs/setup/SETUP_GUIDE.md)** - 환경 설정 및 작업 흐름
- **[서버 실행 가이드](docs/setup/START_SERVER.md)** - 개발 서버 실행 방법
- **[배포 가이드](docs/deployment/DEPLOY_GUIDE.md)** - Firebase/Vercel 배포 방법
- **[Firestore 규칙](docs/deployment/FIRESTORE_RULES.md)** - 보안 규칙 설정
- **[프로젝트 구조](docs/development/PROJECT_STRUCTURE.md)** - 상세 프로젝트 구조
- **[기여 가이드](docs/development/CONTRIBUTING.md)** - 기여 방법 및 규칙

## 👥 기여

프로젝트를 포크하고 브랜치를 생성한 후 변경사항을 커밋하고 푸시하세요.
자세한 내용은 [기여 가이드](docs/development/CONTRIBUTING.md)를 참고하세요.

---

**문의**: 프로젝트 관련 문의사항이 있으면 이슈를 생성해주세요.
