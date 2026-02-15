# NEUN - Web3 Jobs Platform

> Web3/블록체인 채용 공고를 글로벌 40+ 사이트에서 자동으로 수집하는 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## Features

- **Auto Crawling**: 12+ 사이트에서 실시간 채용 공고 수집
- **Global & Korea**: 해외 및 한국 Web3 채용 정보 통합
- **Smart Search**: 직무, 지역, 회사, VC 백커별 필터링
- **Trust Score**: VC 포트폴리오 기반 신뢰도 검증
- **Web3 Native**: 지갑 연결, 북마크, Job 제출 기능
- **AI Powered**: Claude API 활용 콘텐츠 요약 및 번역

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 | App Router, SSR/SSG |
| React | 19 | UI Components |
| TypeScript | 5 | Type Safety |
| Tailwind CSS | 3.4 | Styling |
| Radix UI | - | Headless Components |
| Framer Motion | 12 | Animations |
| Recharts | 3 | Data Visualization |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | - | PostgreSQL Database, Auth |
| Prisma | 6 | ORM (로컬 개발용) |
| Zod | 4 | Schema Validation |

### Web3
| Technology | Purpose |
|------------|---------|
| wagmi | React Hooks for Ethereum |
| viem | Low-level Ethereum Interface |
| WalletConnect | Multi-wallet Support |
| MetaMask SDK | MetaMask Integration |
| Coinbase Wallet | Coinbase Integration |

### Crawler
| Technology | Purpose |
|------------|---------|
| Axios | HTTP Client |
| Cheerio | HTML Parsing |
| Puppeteer | Dynamic Site Crawling |
| Playwright | E2E Testing |

### AI & Analytics
| Technology | Purpose |
|------------|---------|
| Anthropic Claude | AI Summarization |
| Discord Webhooks | Notifications |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/web3-jobs-platform.git
cd web3-jobs-platform
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# .env.local 파일을 열어 필수 환경변수 입력
```

### 3. Database Setup

```bash
# Prisma 로컬 개발용 (SQLite)
npx prisma db push

# 또는 Supabase 연결 확인
npm run check:db
```

### 4. Run Development Server

```bash
npm run dev
```

브라우저에서 http://localhost:3000 열기

### 5. Run Crawler (Optional)

```bash
npm run crawl
```

## Project Structure

```
web3-jobs-platform/
├── app/                          # Next.js App Router
│   ├── (routes)/                 # 페이지 라우트
│   │   ├── jobs/                 # 채용 공고 목록/상세
│   │   ├── companies/            # 회사 목록
│   │   ├── investors/            # VC 투자사 목록
│   │   ├── ecosystems/           # 생태계별 분류
│   │   ├── bounties/             # 바운티 프로그램
│   │   └── articles/             # 아티클/뉴스
│   ├── admin/                    # 관리자 대시보드
│   ├── api/                      # API Routes
│   │   ├── jobs/                 # 채용 API
│   │   ├── auth/                 # 인증 API
│   │   ├── admin/                # 관리자 API
│   │   ├── cron/                 # 스케줄 작업
│   │   └── trust/                # 신뢰도 API
│   ├── components/               # 공통 컴포넌트
│   │   ├── badges/               # 뱃지 컴포넌트
│   │   └── ui/                   # UI 기본 컴포넌트
│   └── auth/                     # 인증 콜백
├── scripts/                      # 크롤러 & 유틸리티
│   ├── crawl.ts                  # 메인 크롤러 진입점
│   ├── crawlers/                 # 개별 사이트 크롤러
│   │   ├── platforms/            # ATS 플랫폼 크롤러
│   │   └── utils/                # 크롤러 유틸리티
│   └── utils/                    # 공통 유틸리티
├── lib/                          # 라이브러리 & 헬퍼
│   ├── api/                      # API 클라이언트
│   ├── i18n/                     # 다국어 지원
│   ├── security/                 # 보안 유틸리티
│   └── validations/              # 유효성 검사
├── components/                   # 전역 컴포넌트
│   ├── admin/                    # 관리자 컴포넌트
│   └── ui/                       # shadcn/ui 컴포넌트
├── hooks/                        # Custom React Hooks
├── types/                        # TypeScript 타입 정의
├── prisma/                       # Prisma 스키마 & 마이그레이션
├── supabase/                     # Supabase 설정
├── tests/                        # 테스트 파일
│   └── load/                     # k6 부하 테스트
├── docs/                         # 프로젝트 문서
└── public/                       # 정적 파일
```

## Scripts

### Development
```bash
npm run dev              # 개발 서버 시작
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 시작
npm run lint             # ESLint 검사
```

### Database
```bash
npm run db:push          # Prisma 스키마 푸시
npm run db:studio        # Prisma Studio GUI
```

### Crawling
```bash
npm run crawl            # 전체 크롤링 실행
npm run schedule         # 스케줄러 실행
npm run dev:all          # 개발 서버 + 스케줄러 동시 실행
```

### Data Management
```bash
npm run check:expired    # 만료된 공고 확인
npm run validate         # 공고 데이터 유효성 검사
npm run refresh:featured # Featured 점수 갱신
npm run fix:descriptions # 설명 데이터 정리
```

### Testing
```bash
npm run test:all         # 전체 테스트
npm run test:unit        # 단위 테스트
npm run test:api         # API 테스트
npm run test:e2e         # E2E 테스트
npm run test:load        # 부하 테스트 (k6)
```

### Translation & AI
```bash
npm run translate:korean      # 한국어 번역 (드라이런)
npm run translate:korean:apply # 한국어 번역 적용
npm run translate:ai          # AI 번역 (Claude)
```

### Newsletter
```bash
npm run newsletter       # 주간 뉴스레터 생성
npm run newsletter:output # 뉴스레터 파일 출력
```

## Documentation

- [Database Schema](docs/DATABASE.md) - 데이터베이스 스키마 문서
- [Crawlers Guide](docs/CRAWLERS.md) - 크롤러 목록 및 가이드
- [Design Principles](docs/DESIGN_PRINCIPLES.md) - UI/UX 디자인 원칙
- [Performance Guide](docs/optimization-guide.md) - 성능 최적화 가이드

## Environment Variables

자세한 환경변수 설명은 [.env.example](.env.example) 참고

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anonymous Key

### Optional
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key (서버 전용)
- `ANTHROPIC_API_KEY` - Claude API Key
- `DISCORD_WEBHOOK_URL` - Discord 알림 웹훅
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect 프로젝트 ID

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```bash
docker build -t neun-web3-jobs .
docker run -p 3000:3000 neun-web3-jobs
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

---

Built with love for the Web3 Community
