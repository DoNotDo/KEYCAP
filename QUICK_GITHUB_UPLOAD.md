# 🚀 GitHub에 코드 올리기 - 빠른 가이드

## 현재 상태
- ✅ Git 초기화 완료
- ✅ 커밋 완료
- ✅ 원격 저장소 설정 완료: `https://github.com/DoNotDo/KEYCAPS.git`

## 다음 단계

### 1. GitHub에서 저장소 생성
1. [github.com](https://github.com) 접속
2. 로그인 (DoNotDo 계정)
3. 우측 상단 "+" → "New repository"
4. 저장소 이름: **KEYCAPS**
5. ⚠️ **"Initialize with README" 체크 해제**
6. "Create repository" 클릭

### 2. 푸시 명령어 실행
저장소를 만든 후 아래 명령어를 실행하세요:

```bash
git push -u origin main
```

### 3. 인증 (필요한 경우)
- Personal Access Token 사용 권장
- 또는 GitHub Desktop 사용

---

## 저장소를 이미 만드셨다면?
아래 명령어로 바로 푸시할 수 있습니다:

```bash
git push -u origin main
```

---

## 문제 해결

### "Repository not found" 에러
→ GitHub에서 저장소를 먼저 만들어야 합니다.

### 인증 에러
→ Personal Access Token이 필요합니다:
1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token" → `repo` 권한 선택
3. 생성된 토큰을 비밀번호 대신 사용
