# 🌐 Web3 Jobs Platform

글로벌 & 국내 Web3 채용 공고를 40개 이상의 사이트에서 자동으로 수집하는 플랫폼

## ✨ 주요 기능

- 📡 **자동 크롤링**: 40+ 사이트에서 실시간 채용 공고 수집
- 🌍 **글로벌 & 국내**: 해외 및 한국 Web3 채용 정보 통합
- 🔍 **스마트 검색**: 직무, 지역, 회사별 필터링
- 📊 **통계 대시보드**: 실시간 채용 시장 인사이트
- 🚀 **빠른 업데이트**: 매일 자동 갱신

## 🎯 크롤링 대상 사이트 (40+)

### Tier 1 (높은 우선순위)
- web3.career
- Web3Jobs
- Wellfound
- Web3 KR Jobs

### Tier 2 (중간 우선순위)
- CryptocurrencyJobs.co
- CryptoJobsList
- Remote3.co
- 원티드 (Web3 필터)
- 로켓펀치 (블록체인)
- 잡코리아 (Web3.0)

### Tier 3 (생태계별)
- Sui Jobs
- Ethereum Foundation
- Solana Jobs
- Avalanche Jobs
- 그 외 27개 사이트...

## ⚙️ 환경변수 설정

`.env.example`을 복사해서 `.env` 파일을 만드세요:

```bash
cp .env.example .env
```

**필수 환경변수:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 익명 키

**선택 환경변수:**
- `ANTHROPIC_API_KEY` - AI 콘텐츠 생성용
- `DISCORD_WEBHOOK_URL` - 알림용
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - 지갑 연결용

자세한 내용은 `.env.example` 파일을 참고하세요.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 설정

```bash
npx prisma db push
```

### 3. 크롤링 실행

```bash
npm run crawl
```

### 4. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

## 📋 주요 명령어

```bash
# 개발 서버 시작
npm run dev

# 크롤링 실행
npm run crawl

# 데이터베이스 마이그레이션
npm run db:push

# Prisma Studio (DB GUI)
npm run db:studio

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 🗂️ 프로젝트 구조

```
web3-jobs-platform/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── globals.css        # 글로벌 스타일
├── scripts/               # 크롤링 스크립트
│   ├── crawl.ts          # 메인 크롤러
│   ├── utils.ts          # 유틸리티 함수
│   └── crawlers/         # 개별 사이트 크롤러
│       ├── web3career.ts
│       ├── web3jobs.ts
│       └── web3krjobs.ts
├── lib/                   # 라이브러리
│   └── prisma.ts         # Prisma 클라이언트
├── prisma/               # 데이터베이스
│   └── schema.prisma     # DB 스키마
└── package.json          # 프로젝트 설정
```

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js, TypeScript
- **Database**: SQLite (개발), PostgreSQL (프로덕션)
- **ORM**: Prisma
- **Crawler**: Axios, Cheerio, Puppeteer

## 📊 데이터베이스 스키마

### Job (채용 공고)
- 제목, 회사, 위치, 타입
- 카테고리, 설명, URL
- 급여, 태그, 출처
- 지역 (Global/Korea)
- 게시일, 크롤링일

### CrawlLog (크롤링 로그)
- 출처, 상태, 공고 수
- 에러 메시지, 생성일

## 🔄 크롤링 로드맵

### Week 1-2: 프로젝트 세팅 ✅
- Next.js + TypeScript 설정
- Prisma + SQLite 설정
- 기본 UI 구축

### Week 3-4: Tier 1 크롤러 (진행 중)
- ✅ web3.career
- ✅ Web3Jobs
- ✅ Web3 KR Jobs
- ⏳ Wellfound

### Week 5-8: Tier 2 크롤러
- 13개 Web3 전문 플랫폼
- 원티드, 로켓펀치, 잡코리아

### Week 9-12: Tier 3 크롤러
- 11개 생태계별 채용 페이지
- Sui, Ethereum, Solana 등

### Week 13-15: 고급 기능
- 필터링 & 검색
- 알림 시스템
- API 개발

### Week 16-18: 최적화 & 배포
- 성능 최적화
- 자동화 스케줄링
- 프로덕션 배포

## 🌟 향후 계획

- [ ] Puppeteer를 활용한 동적 사이트 크롤링
- [ ] 이메일 알림 기능
- [ ] 북마크 & 지원 추적
- [ ] 급여 데이터 분석
- [ ] REST API 제공
- [ ] 모바일 앱

## 📝 라이선스

MIT License

## 👥 기여하기

이슈와 PR은 언제나 환영입니다!

## 📧 문의

문제가 있으면 GitHub Issues에 등록해주세요.

---

Made with ❤️ for the Web3 Community
