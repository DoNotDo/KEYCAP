# Firebase 클라우드 연동 설정 가이드

## 1. Firebase Console에서 설정 정보 가져오기

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. 프로젝트 설정 (톱니바퀴 아이콘) 클릭
4. "내 앱" 섹션에서 웹 앱 선택 (또는 새로 추가)
5. 설정 정보 복사:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId` (이미 제공받음: `1:981753652672:web:9038dadd699022179cd425`)

## 2. Firebase 설정 파일 업데이트

`src/utils/firebase.ts` 파일을 열고 위에서 복사한 정보로 업데이트:

```typescript
const firebaseConfig = {
  apiKey: "여기에_API_KEY_입력",
  authDomain: "여기에_AUTH_DOMAIN_입력",
  projectId: "여기에_PROJECT_ID_입력",
  storageBucket: "여기에_STORAGE_BUCKET_입력",
  messagingSenderId: "981753652672",
  appId: "1:981753652672:web:9038dadd699022179cd425"
};
```

## 3. Firestore 데이터베이스 설정

1. Firebase Console에서 "Firestore Database" 메뉴 클릭
2. "데이터베이스 만들기" 클릭
3. "프로덕션 모드" 또는 "테스트 모드" 선택 (테스트 모드 권장)
4. 위치 선택 (가장 가까운 리전 선택)

### 보안 규칙 설정 (테스트용)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**주의**: 프로덕션 환경에서는 더 엄격한 보안 규칙을 설정해야 합니다.

## 4. Authentication 설정

1. Firebase Console에서 "Authentication" 메뉴 클릭
2. "시작하기" 클릭
3. "이메일/비밀번호" 제공업체 활성화
4. "저장" 클릭

## 5. 코드 적용

현재 코드는 로컬 스토리지를 사용하고 있습니다. Firebase로 전환하려면:

### 옵션 1: 완전 전환 (권장)
- `src/utils/storage.ts` → `src/utils/storage.firebase.ts`로 교체
- `src/utils/auth.ts` → `src/utils/auth.firebase.ts`로 교체
- `src/hooks/useInventory.ts`에서 import 경로 수정

### 옵션 2: 환경 변수로 선택
- 환경 변수를 통해 로컬/클라우드 모드 선택 가능하도록 구현

## 6. 데이터 마이그레이션

기존 로컬 스토리지 데이터를 Firebase로 마이그레이션하는 스크립트를 실행할 수 있습니다.

## 7. 배포

### Vercel 배포 (권장)
1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정 (필요시)
4. 배포

### Firebase Hosting 배포
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 주의사항

1. **보안**: API 키는 클라이언트에 노출되지만, Firestore 보안 규칙으로 보호해야 합니다.
2. **비용**: Firebase 무료 티어가 있지만, 사용량에 따라 비용이 발생할 수 있습니다.
3. **오프라인**: Firestore는 오프라인 지원이 있지만, 초기 동기화가 필요합니다.
