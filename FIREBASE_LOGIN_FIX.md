# 🔐 Firebase 로그인 문제 해결

## 문제 원인

Firebase Authentication에 사용자가 아직 등록되지 않았을 수 있습니다.

## 해결 방법

### 방법 1: Firebase Console에서 확인 (권장)

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 `management-9f7d8` 선택
3. **Authentication** 메뉴 클릭
4. **사용자** 탭 확인
   - 사용자가 없으면 앱을 한 번 실행하면 자동으로 생성됩니다
   - 또는 수동으로 추가할 수 있습니다

### 방법 2: 앱 초기화 확인

앱이 시작될 때 `auth.initialize()`가 실행되어야 합니다.
브라우저 콘솔(F12)에서 다음 메시지를 확인하세요:
- "사용자 마이그레이션 오류" - 정상 (처음 실행 시)
- "Error initializing auth" - 오류 발생

### 방법 3: 간단한 로그인 방식으로 변경

Firebase Authentication 대신 Firestore에서 직접 사용자를 찾는 방식으로 변경할 수 있습니다.

---

## 빠른 해결: 코드 수정

로그인 로직을 수정하여 Firestore에서 직접 사용자를 찾도록 변경하겠습니다.
