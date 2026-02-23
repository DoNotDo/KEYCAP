# GitHub Actions Firebase 배포 시크릿 설정

배포 워크플로우는 **FIREBASE_TOKEN** 시크릿을 사용합니다. 아래만 하면 됩니다.

---

## 방법: FIREBASE_TOKEN (권장, 2분)

### 1. 로컬에서 토큰 받기

프로젝트 폴더에서 터미널 실행:

```bash
npx firebase login:ci
```

- 브라우저가 열리면 **Google 계정으로 로그인** (Firebase 프로젝트 management-9f7d8에 접근 가능한 계정)
- 로그인 후 터미널에 **긴 토큰 문자열**이 출력됨 → **전부 복사**

### 2. GitHub에 시크릿 추가

1. **GitHub**에서 KEYCAP 저장소 열기
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. **Name**: `FIREBASE_TOKEN` (이름 그대로)
5. **Value**: 1단계에서 복사한 **토큰 전체** 붙여넣기
6. **Add secret** 저장

### 3. 배포 실행

- **main**에 푸시하거나  
- **Actions** 탭 → **Deploy to Firebase Hosting** → **Run workflow**

토큰은 오래 쓰면 만료될 수 있습니다. 배포가 다시 실패하면 1~2단계를 반복해 새 토큰을 받아 시크릿을 갱신하면 됩니다.

---

## 요약

| 항목 | 값 |
|------|-----|
| 시크릿 이름 | `FIREBASE_TOKEN` |
| 시크릿 값 | `firebase login:ci` 로 받은 토큰 전체 |
| 설정 위치 | GitHub → Settings → Secrets and variables → Actions |

이렇게 한 번 설정하면 main 푸시 시 자동 배포가 동작합니다.
