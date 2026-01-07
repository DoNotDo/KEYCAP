# 🔥 Firebase 클라우드 연동 완료

애플리케이션이 Firebase를 사용하여 클라우드에서 실시간으로 동기화되도록 설정되었습니다.

## 📋 완료된 작업

✅ Firebase SDK 설치  
✅ Firebase 설정 파일 생성 (`src/utils/firebase.ts`)  
✅ Firestore Storage 구현 (`src/utils/storage.firebase.ts`)  
✅ Firebase Authentication 구현 (`src/utils/auth.firebase.ts`)  
✅ 통합 모듈 생성 (로컬/클라우드 선택 가능)  
✅ 설정 가이드 문서 작성  

## 🚀 빠른 시작

### 1. Firebase Console에서 설정 정보 가져오기

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 설정 (⚙️) → 일반 탭
3. 웹 앱의 설정 정보 복사:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_FIREBASE_API_KEY=여기에_API_KEY_입력
VITE_FIREBASE_AUTH_DOMAIN=여기에_AUTH_DOMAIN_입력
VITE_FIREBASE_PROJECT_ID=여기에_PROJECT_ID_입력
VITE_FIREBASE_STORAGE_BUCKET=여기에_STORAGE_BUCKET_입력
VITE_FIREBASE_MESSAGING_SENDER_ID=981753652672
VITE_FIREBASE_APP_ID=1:981753652672:web:9038dadd699022179cd425
VITE_STORAGE_MODE=firebase
```

### 3. Firebase 서비스 설정

#### Firestore Database
- Firebase Console → Firestore Database
- 데이터베이스 만들기 → 테스트 모드
- 위치 선택 (예: `asia-northeast3` - 서울)

#### Authentication
- Firebase Console → Authentication
- 이메일/비밀번호 활성화

### 4. 코드 적용

**옵션 A: 통합 버전 사용 (권장)**

`src/utils/storage.ts` 파일을 다음으로 교체:
```typescript
export { storage } from './storage.integrated';
```

`src/utils/auth.ts` 파일을 다음으로 교체:
```typescript
export { auth } from './auth.integrated';
```

**옵션 B: 직접 Firebase 사용**

`src/hooks/useInventory.ts`:
```typescript
import { storage } from '../utils/storage.firebase';
```

`src/App.tsx`:
```typescript
import { auth } from './utils/auth.firebase';
```

### 5. 개발 서버 재시작

```bash
npm run dev
```

## 📁 생성된 파일

- `src/utils/firebase.ts` - Firebase 초기화
- `src/utils/storage.firebase.ts` - Firestore Storage 구현
- `src/utils/auth.firebase.ts` - Firebase Authentication 구현
- `src/utils/storage.integrated.ts` - 통합 Storage (로컬/클라우드 선택)
- `src/utils/auth.integrated.ts` - 통합 Auth (로컬/클라우드 선택)
- `FIREBASE_SETUP.md` - 상세 설정 가이드
- `FIREBASE_QUICK_START.md` - 빠른 시작 가이드

## 🔄 모드 전환

환경 변수 `VITE_STORAGE_MODE`로 전환:
- `local` - 로컬 스토리지 사용 (기본값)
- `firebase` - Firebase 클라우드 사용

## ✨ 주요 기능

- ✅ 실시간 데이터 동기화
- ✅ 여러 PC에서 동시 접근
- ✅ 자동 백업
- ✅ 사용자 인증
- ✅ 오프라인 지원 (Firestore 기본 기능)

## 📖 상세 문서

- [빠른 시작 가이드](./FIREBASE_QUICK_START.md)
- [상세 설정 가이드](./FIREBASE_SETUP.md)

## ⚠️ 주의사항

1. **보안**: Firestore 보안 규칙을 프로덕션 환경에 맞게 설정하세요.
2. **비용**: Firebase 무료 티어가 있지만 사용량에 따라 비용이 발생할 수 있습니다.
3. **데이터 마이그레이션**: 기존 로컬 데이터를 Firebase로 마이그레이션하는 스크립트가 필요할 수 있습니다.

## 🆘 문제 해결

문제가 발생하면:
1. 브라우저 콘솔에서 오류 확인
2. Firebase Console에서 서비스 상태 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. 개발 서버 재시작
