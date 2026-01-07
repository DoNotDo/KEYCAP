# Firebase 클라우드 연동 빠른 시작 가이드

## 1단계: Firebase Console에서 설정 정보 가져오기

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. ⚙️ **프로젝트 설정** 클릭
4. **일반** 탭에서 **내 앱** 섹션의 웹 앱 선택
5. 다음 정보를 복사하세요:
   - `apiKey`
   - `authDomain` 
   - `projectId`
   - `storageBucket`
   - `messagingSenderId` (이미 있음: `981753652672`)
   - `appId` (이미 있음: `1:981753652672:web:9038dadd699022179cd425`)

## 2단계: 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Firebase 설정 (Firebase Console에서 복사한 값으로 교체)
VITE_FIREBASE_API_KEY=여기에_API_KEY_입력
VITE_FIREBASE_AUTH_DOMAIN=여기에_AUTH_DOMAIN_입력
VITE_FIREBASE_PROJECT_ID=여기에_PROJECT_ID_입력
VITE_FIREBASE_STORAGE_BUCKET=여기에_STORAGE_BUCKET_입력
VITE_FIREBASE_MESSAGING_SENDER_ID=981753652672
VITE_FIREBASE_APP_ID=1:981753652672:web:9038dadd699022179cd425

# 사용 모드: 'local' (로컬 스토리지) 또는 'firebase' (클라우드)
VITE_STORAGE_MODE=firebase
```

## 3단계: Firestore 데이터베이스 설정

1. Firebase Console에서 **Firestore Database** 메뉴 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 (개발 중)
4. 위치 선택 (가장 가까운 리전, 예: `asia-northeast3` - 서울)
5. **사용 설정** 클릭

### 보안 규칙 설정 (테스트용)

Firestore의 **규칙** 탭에서 다음 규칙을 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 읽기/쓰기 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ 주의**: 프로덕션 환경에서는 더 엄격한 규칙이 필요합니다.

## 4단계: Authentication 설정

1. Firebase Console에서 **Authentication** 메뉴 클릭
2. **시작하기** 클릭
3. **이메일/비밀번호** 제공업체 활성화
4. **저장** 클릭

## 5단계: 코드 적용

### 방법 1: 통합 버전 사용 (권장)

`src/utils/storage.ts`와 `src/utils/auth.ts`의 import를 변경:

**src/utils/storage.ts** (또는 새 파일 생성):
```typescript
export { storage } from './storage.integrated';
```

**src/utils/auth.ts** (또는 새 파일 생성):
```typescript
export { auth } from './auth.integrated';
```

### 방법 2: 직접 전환

`src/hooks/useInventory.ts`에서:
```typescript
// 기존
import { storage } from '../utils/storage';

// 변경
import { storage } from '../utils/storage.firebase';
```

`src/App.tsx`에서:
```typescript
// 기존
import { auth } from './utils/auth';

// 변경
import { auth } from './utils/auth.firebase';
```

## 6단계: 개발 서버 재시작

환경 변수를 변경했으므로 개발 서버를 재시작하세요:

```bash
npm run dev
```

## 7단계: 테스트

1. 애플리케이션 실행
2. 로그인 시도
3. 데이터 추가/수정
4. 다른 브라우저나 PC에서 같은 Firebase 프로젝트로 접속하여 실시간 동기화 확인

## 문제 해결

### "Firebase: Error (auth/configuration-not-found)"
- Firebase 설정 정보가 올바르게 입력되었는지 확인
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작했는지 확인

### "Firebase: Error (permission-denied)"
- Firestore 보안 규칙 확인
- Authentication이 활성화되었는지 확인

### 데이터가 동기화되지 않음
- `VITE_STORAGE_MODE=firebase`로 설정되었는지 확인
- 브라우저 콘솔에서 오류 메시지 확인
- Firebase Console의 Firestore에서 데이터 확인

## 다음 단계

- [ ] 프로덕션 환경을 위한 보안 규칙 설정
- [ ] 사용자 권한 관리 세분화
- [ ] 오프라인 지원 최적화
- [ ] 데이터 백업 설정
