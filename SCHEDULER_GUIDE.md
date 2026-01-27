# ⏰ 자동 크롤링 스케줄링 가이드

## 🚀 빠른 시작

### 개발 환경 (로컬)

#### 방법 1: 서버 + 스케줄러 동시 실행 (추천)
```bash
npm install
npm run dev:all
```

이렇게 하면:
- Next.js 서버가 포트 3000에서 실행
- 스케줄러가 백그라운드에서 실행
- 서버 시작 시 즉시 1회 크롤링
- 이후 매일 오전 9시에 자동 크롤링

#### 방법 2: 별도 실행
터미널 1:
```bash
npm run dev
```

터미널 2:
```bash
npm run schedule
```

### 수동 크롤링
```bash
npm run crawl
```

---

## ⏰ 스케줄 설정

현재 설정: **매일 오전 9시**

### 스케줄 변경 방법

`scripts/scheduler.ts` 파일을 열고 `scheduleDaily` 변수를 수정하세요:

```typescript
// 현재: 매일 오전 9시
const scheduleDaily = '0 9 * * *'

// 매일 오후 6시
const scheduleDaily = '0 18 * * *'

// 매일 오전 6시, 오후 6시 (하루 2번)
const scheduleTwiceDaily = '0 6,18 * * *'

// 6시간마다
const scheduleEvery6Hours = '0 */6 * * *'

// 3시간마다
const scheduleEvery3Hours = '0 */3 * * *'

// 매주 월요일 오전 9시
const scheduleWeekly = '0 9 * * 1'
```

### Cron 표현식 설명
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 요일 (0-7, 0과 7은 일요일)
│ │ │ └─── 월 (1-12)
│ │ └───── 일 (1-31)
│ └─────── 시 (0-23)
└───────── 분 (0-59)
```

---

## 🖥️ 프로덕션 배포

### PM2 사용 (추천)

#### 1. PM2 설치
```bash
npm install -g pm2
```

#### 2. 앱 빌드
```bash
npm run build
```

#### 3. PM2로 시작
```bash
pm2 start ecosystem.config.js
```

이렇게 하면:
- 웹 서버와 스케줄러가 별도 프로세스로 실행
- 자동 재시작
- 로그 관리
- 모니터링

#### 4. PM2 명령어
```bash
# 상태 확인
pm2 status

# 로그 보기
pm2 logs

# 재시작
pm2 restart all

# 중지
pm2 stop all

# 삭제
pm2 delete all

# 부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

---

## 📊 모니터링

### 로그 확인

스케줄러 로그:
```bash
# PM2 사용 시
pm2 logs web3-jobs-scheduler

# 직접 실행 시 - 터미널에 출력됨
```

크롤링 로그는 데이터베이스에 저장됨:
```bash
npm run db:studio
```

`CrawlLog` 테이블에서 확인 가능:
- 크롤링 시간
- 성공/실패 상태
- 수집한 공고 수
- 에러 메시지

---

## 🔧 문제 해결

### 스케줄러가 실행 안 됨
```bash
# node-cron 설치 확인
npm install node-cron @types/node-cron

# 스케줄러 직접 실행
npm run schedule
```

### 크롤링은 되는데 스케줄이 작동 안 됨
- `scripts/scheduler.ts`의 cron 표현식 확인
- 시스템 시간 확인 (타임존)
- PM2 재시작: `pm2 restart all`

### 메모리 부족
- 크롤링 빈도 줄이기 (6시간 → 12시간)
- PM2 메모리 제한 설정:
  ```bash
  pm2 start ecosystem.config.js --max-memory-restart 500M
  ```

---

## 🎯 추천 설정

### 개인 프로젝트
- **빈도**: 매일 1회 (오전 9시)
- **이유**: 데이터 충분히 최신, 서버 부담 적음

### 프로덕션 서비스
- **빈도**: 6시간마다
- **이유**: 실시간성 유지, 사용자에게 최신 정보 제공

### 테스트/개발
- **빈도**: 수동 실행 (`npm run crawl`)
- **이유**: 리소스 절약, 필요할 때만 실행

---

## 📝 참고사항

- 각 크롤링은 5-10분 소요
- 11개 사이트에서 데이터 수집
- Rate limiting 적용 (사이트당 0.1초 delay)
- 실패한 크롤러가 있어도 다른 크롤러는 계속 실행
- 중복 데이터는 자동으로 업데이트됨 (upsert)

---

## 🚀 다음 단계

- [ ] 크롤링 실패 시 이메일 알림
- [ ] 크롤링 대시보드 추가
- [ ] 특정 사이트만 선택적으로 크롤링
- [ ] 우선순위별 크롤링 빈도 조정
- [ ] 웹훅으로 크롤링 완료 알림

---

Made with ❤️ for Web3 Community
