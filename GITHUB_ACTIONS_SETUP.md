# 🤖 GitHub Actions 자동 크롤링 설정 가이드

## ✨ 완전 자동화!

GitHub Actions를 사용하면:
- ✅ 맥북 꺼도 계속 실행
- ✅ 3시간마다 자동 크롤링
- ✅ Discord 알림 자동 전송
- ✅ 무료! (월 2000분)

---

## 📋 설정 방법 (5분 컷!)

### 1️⃣ GitHub Repository 만들기

1. https://github.com 로그인
2. "New repository" 클릭
3. Repository 이름: `web3-jobs-platform`
4. Public 또는 Private 선택
5. "Create repository" 클릭

---

### 2️⃣ 코드 업로드

터미널에서:

```bash
cd ~/Downloads/"web3-jobs-platform 2"

# Git 초기화
git init
git add .
git commit -m "Initial commit: Web3 Jobs Platform"

# GitHub에 연결 (아래 URL은 본인 것으로 변경!)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/web3-jobs-platform.git
git push -u origin main
```

**YOUR_USERNAME**을 본인 GitHub 아이디로 바꾸세요!

---

### 3️⃣ Discord Webhook Secret 설정

1. GitHub Repository 페이지에서
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. Name: `DISCORD_WEBHOOK_URL`
5. Value: 
   ```
   https://discord.com/api/webhooks/1465197779914592502/kyCCE7Ggbd19eBtY0nSQKgx2wiiYcOMY6TFNDBvSBnOtFj2LSML8gUq-b6t1p7_kkfP4
   ```
6. **Add secret** 클릭

---

### 4️⃣ GitHub Actions 활성화

1. Repository에서 **Actions** 탭 클릭
2. "I understand my workflows, go ahead and enable them" 클릭
3. 자동으로 워크플로우가 시작됩니다!

---

### 5️⃣ 수동 실행 테스트

1. **Actions** 탭
2. **Web3 Jobs Crawler** 클릭
3. **Run workflow** 버튼
4. **Run workflow** 확인

**Discord에서 알림 확인!** 🎉

---

## ⏰ 자동 실행 스케줄

현재 설정: **3시간마다**

```yaml
# .github/workflows/crawler.yml
on:
  schedule:
    - cron: '0 */3 * * *'  # 3시간마다
```

### 스케줄 변경하려면:

```yaml
# 6시간마다
- cron: '0 */6 * * *'

# 매일 오전 9시 (UTC 기준)
- cron: '0 9 * * *'

# 매일 오전 9시, 오후 6시 (KST 기준: UTC 0시, 9시)
- cron: '0 0,9 * * *'
```

---

## 🔔 Discord 알림 종류

### 1. 시작 알림
```
🚀 Starting Crawl
GitHub Actions crawler started
```

### 2. 완료 알림
```
🎉 Crawl Complete!
Successfully collected 150 jobs from 11 sources

📊 Summary
Total Jobs: 150
Sources: 11/11 successful
Duration: 45.2s

✅ Successful Sources
✅ web3.career: 25 jobs
✅ web3jobs.cc: 30 jobs
...
```

### 3. 에러 알림
```
❌ GitHub Actions Crawl Failed
The scheduled crawl encountered an error
```

---

## 📊 실행 확인

### Actions 페이지에서:
- ✅ 녹색 체크: 성공
- ❌ 빨간 X: 실패
- 🟡 노란 원: 실행 중

### Discord에서:
- 크롤링 시작/완료 알림
- 각 사이트별 결과
- 에러 발생 시 즉시 알림

---

## 💾 데이터베이스 저장

**문제**: GitHub Actions는 매번 새로운 환경이라 DB가 초기화됨

**해결책**:

### 옵션 1: Supabase (추천!)
무료 PostgreSQL 데이터베이스

1. https://supabase.com 가입
2. New project 생성
3. Connection string 복사
4. GitHub Secrets에 추가:
   - Name: `DATABASE_URL`
   - Value: `postgresql://...`
5. `prisma/schema.prisma` 수정:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### 옵션 2: PlanetScale
무료 MySQL 데이터베이스

### 옵션 3: Railway
무료 PostgreSQL

---

## 🚀 프로덕션 배포 (선택)

### Vercel 배포:
```bash
npm install -g vercel
vercel
```

### Railway 배포:
1. https://railway.app 가입
2. GitHub 연결
3. 자동 배포

---

## 🔧 문제 해결

### Actions가 실행 안 됨
- Repository가 Public인지 확인
- Actions 탭에서 활성화 확인
- main 브랜치에 push 했는지 확인

### Discord 알림 안 옴
- Secret이 올바르게 설정됐는지 확인
- Webhook URL이 유효한지 확인

### 크롤링 실패
- Actions 로그 확인
- 각 크롤러별 에러 메시지 확인

---

## 📈 무료 사용량

GitHub Actions 무료 플랜:
- **2,000분/월** (Public repo)
- **500분/월** (Private repo)

현재 설정:
- 1회 크롤링: ~2-3분
- 3시간마다: 하루 8회
- 월 사용량: ~240분

**충분합니다!** ✅

---

## 🎯 다음 단계

1. **데이터베이스 연결** (Supabase 추천)
2. **웹사이트 배포** (Vercel)
3. **더 많은 크롤러 추가**
4. **대시보드 개선**

---

## 💡 팁

- 수동 실행: Actions 탭에서 "Run workflow"
- 로그 확인: Actions → 실행 항목 클릭
- 비용 확인: Settings → Billing
- 스케줄 변경: `.github/workflows/crawler.yml` 수정

---

Made with ❤️ for Web3 Community
