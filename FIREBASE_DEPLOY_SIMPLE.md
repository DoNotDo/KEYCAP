# Firebase Hosting 배포 - 간단 가이드

## 필수 단계 (순서대로)

### 1. Firebase 로그인
```bash
firebase login
```

### 2. Hosting 초기화 (필수!)
```bash
firebase init hosting
```
이 단계를 건너뛰면 `firebase deploy`가 작동하지 않습니다!

질문 답변:
- Use existing project? → **Y**
- Select: **management-9f7d8**
- Public directory: **dist**
- Single-page app? → **Y**
- GitHub 설정? → **N**

### 3. 빌드
```bash
npm run build
```

### 4. 배포
```bash
firebase deploy --only hosting
```

---

## 요약

✅ `firebase login` - 한 번만
✅ `firebase init hosting` - **필수!** (한 번만)
✅ `npm run build` - 배포 전마다
✅ `firebase deploy --only hosting` - 배포할 때마다

---

## 주의사항

- `firebase init hosting`을 하지 않으면 `firebase deploy`가 실패합니다
- 이미 `firebase.json` 파일이 있어도 `firebase init hosting`을 실행해야 합니다
- 빌드를 하지 않으면 `dist` 폴더가 없어서 배포가 실패합니다
