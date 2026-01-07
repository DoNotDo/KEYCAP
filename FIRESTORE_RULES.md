# Firestore 보안 규칙 설정

## 현재 문제

Firestore 보안 규칙이 인증된 사용자만 허용하도록 설정되어 있을 수 있습니다.
하지만 초기 사용자 생성 시에는 인증되지 않은 상태입니다.

## 해결 방법

### Firebase Console에서 보안 규칙 수정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 `management-9f7d8` 선택
3. **Firestore Database** → **규칙** 탭 클릭
4. 다음 규칙으로 변경:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users 컬렉션은 읽기/쓰기 허용 (초기 사용자 생성용)
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // 다른 컬렉션은 인증된 사용자만 허용
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**또는 더 간단하게 (개발 중):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // 개발 중에는 모두 허용
    }
  }
}
```

⚠️ **주의**: 프로덕션 환경에서는 더 엄격한 규칙이 필요합니다!

5. **게시** 버튼 클릭

---

## 확인 방법

1. 브라우저 콘솔(F12)에서 오류 확인
2. Firebase Console → Firestore Database → 데이터 탭
3. `users` 컬렉션이 생성되고 사용자 데이터가 있는지 확인
