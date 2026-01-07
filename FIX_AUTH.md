# 🔐 터미널 인증 문제 해결

## 문제
터미널에서 "Repository not found" 오류가 발생합니다.
→ 인증이 필요합니다 (Private 저장소)

## 해결 방법

### 방법 1: Personal Access Token 사용

1. **토큰 생성:**
   - https://github.com/settings/tokens 접속
   - "Generate new token (classic)"
   - Note: `KEYCAPS`
   - Scopes: **repo** 체크
   - "Generate token" 클릭
   - 토큰 복사 (예: `ghp_xxxxxxxxxxxx`)

2. **원격 URL에 토큰 포함:**
   ```bash
   git remote set-url origin https://토큰@github.com/DoNotDo/KEYCAPS.git
   ```

3. **Pull 및 Push:**
   ```bash
   git pull origin main --allow-unrelated-histories
   git push -u origin main
   ```

### 방법 2: GitHub Desktop 사용 (추천)

GitHub Desktop에서:
1. "Fetch origin" 클릭
2. "Pull origin" 클릭
3. "Push origin" 클릭

터미널 인증 설정 없이 바로 작동합니다!

### 방법 3: Git Credential Manager 사용

```bash
# Windows Credential Manager에 저장
git config --global credential.helper wincred

# 그 다음 pull/push 시도
git pull origin main --allow-unrelated-histories
# Username: DoNotDo
# Password: Personal Access Token 입력
```
