# 🔐 GitHub 인증 문제 해결

## Private 저장소 푸시 방법

### 방법 1: Personal Access Token 사용 (권장)

1. **GitHub에서 토큰 생성:**
   - GitHub → 우측 상단 프로필 → **Settings**
   - 좌측 메뉴 하단 → **Developer settings**
   - **Personal access tokens** → **Tokens (classic)**
   - **Generate new token** → **Generate new token (classic)** 클릭
   - Note: `KEYCAPS Upload` (설명)
   - Expiration: 원하는 기간 선택
   - Scopes: **repo** 체크 (전체 권한)
   - **Generate token** 클릭
   - ⚠️ **토큰을 복사해두세요!** (다시 볼 수 없습니다)

2. **토큰으로 푸시:**
   ```bash
   git push -u origin main
   ```
   - Username: `DoNotDo`
   - Password: **복사한 토큰** 입력

### 방법 2: GitHub Desktop 사용 (가장 쉬움)

1. [desktop.github.com](https://desktop.github.com) 다운로드
2. GitHub 계정으로 로그인
3. File → Add Local Repository
4. `C:\Users\User\Desktop\KEYCAPS` 선택
5. "Publish repository" 클릭

### 방법 3: SSH 키 사용

1. SSH 키 생성 및 GitHub에 등록
2. 원격 URL을 SSH로 변경:
   ```bash
   git remote set-url origin git@github.com:DoNotDo/KEYCAPS.git
   git push -u origin main
   ```

---

## 저장소 확인 체크리스트

✅ GitHub에서 `https://github.com/DoNotDo/KEYCAPS` 접속 가능한가?
✅ 저장소 이름이 정확히 `KEYCAPS`인가? (대소문자 확인)
✅ 저장소가 Private로 설정되어 있나?

---

## 빠른 해결책

가장 쉬운 방법은 **GitHub Desktop**을 사용하는 것입니다:
- GUI로 쉽게 관리
- 자동 인증
- 드래그 앤 드롭으로 간단
