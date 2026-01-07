# 🔥 Firebase 작동 확인 체크리스트

## ✅ 확인 사항

### 1. 브라우저에서 접속
- 주소: `http://localhost:5173`
- 개발 서버가 실행 중인지 확인

### 2. 브라우저 콘솔 확인 (F12)
다음과 같은 메시지가 보이면 정상:
- ✅ "데이터 마이그레이션 완료" (첫 실행 시)
- ✅ Firebase 관련 오류가 없어야 함

### 3. 로그인 테스트
- 사용자명: `admin`
- 비밀번호: `admin123`
- 로그인이 성공하면 ✅

### 4. 데이터 추가 테스트
1. 완성재고 또는 부자재 추가
2. Firebase Console → Firestore Database 확인
3. `items` 컬렉션에 데이터가 보이면 ✅

### 5. Firebase Console 확인
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트: `management-9f7d8` 선택
3. Firestore Database → 데이터 탭
4. 컬렉션 확인:
   - `items` - 재고 데이터
   - `orders` - 주문 데이터
   - `bom` - BOM 데이터
   - `users` - 사용자 데이터

### 6. 실시간 동기화 테스트
1. 브라우저 2개 열기
2. 한 브라우저에서 데이터 추가
3. 다른 브라우저에서 새로고침
4. 데이터가 보이면 ✅

---

## 🐛 문제 해결

### 오류: "Firebase: Error (auth/configuration-not-found)"
→ `.env` 파일 확인 또는 `firebase.ts`의 기본값 사용 중

### 오류: "Firebase: Error (permission-denied)"
→ Firestore 보안 규칙 확인 필요

### 데이터가 보이지 않음
→ Firebase Console에서 Firestore Database가 생성되어 있는지 확인

---

## 🎉 성공 확인

다음이 모두 작동하면 성공:
- ✅ 로그인 가능
- ✅ 데이터 추가/수정 가능
- ✅ Firebase Console에서 데이터 확인 가능
- ✅ 브라우저 캐시 삭제 후에도 데이터 유지
