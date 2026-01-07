# 🔐 Personal Access Token으로 푸시하기

## 1단계: GitHub에서 토큰 생성

1. **GitHub 접속** → 우측 상단 프로필 클릭 → **Settings**
2. 좌측 하단 → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token** → **Generate new token (classic)**
5. 설정:
   - **Note**: `KEYCAPS Upload`
   - **Expiration**: 원하는 기간 선택
   - **Scopes**: **repo** 체크 (전체 권한)
6. **Generate token** 클릭
7. ⚠️ **토큰을 복사해두세요!** (예: `ghp_xxxxxxxxxxxxxxxxxxxx`)

## 2단계: 토큰으로 푸시

터미널에서:
```bash
git push -u origin main
```

질문이 나오면:
- **Username**: `DoNotDo`
- **Password**: **복사한 토큰** 입력 (비밀번호가 아님!)

---

## 방법 2: GitHub Desktop 사용 (더 쉬움)

1. [desktop.github.com](https://desktop.github.com) 다운로드
2. GitHub 계정으로 로그인
3. File → Add Local Repository
4. `C:\Users\User\Desktop\KEYCAPS` 선택
5. "Publish repository" 클릭

---

## 방법 3: URL에 토큰 포함 (일회성)

```bash
git remote set-url origin https://토큰@github.com/DoNotDo/KEYCAPS.git
git push -u origin main
```

⚠️ 보안상 권장하지 않지만, 빠르게 테스트할 수 있습니다.
