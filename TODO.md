# TODO - NEUN Web3 Jobs Platform

> 현재 진행 상황 및 백로그

Last Updated: 2026-02-18 (Evening) KST

---

## Current Status

| Category | Status | Progress |
|----------|--------|----------|
| Core Features | ✅ Complete | 100% |
| Crawlers | ✅ Complete | 15/15 active |
| Crawler Quality | ✅ Complete | **15/15 at 90+ points** |
| UI/UX | ✅ Complete | Production ready |
| Admin Dashboard | ✅ Complete | 4DX Dashboard with WIG tracking |
| Web3 Integration | ✅ Complete | Wallet connection working |
| AI Features | ✅ Complete | Claude integration |
| DB Tables | ✅ Complete | bookmarks, job_alerts, job_applications |
| Testing | ✅ Complete | Unit/API/E2E tests |
| SEO | ✅ Complete | Dynamic OG, JSON-LD |
| Documentation | 🔄 In Progress | 80% |

### Live Stats (2026-02-18)
- Total Active Jobs: **636**
- Total Crawler Sources: **15**
- Average Quality Score: **94점**
- Sources at 90+: **15/15 (100%)**

---

## Recently Completed

### February 2026 (Week 4) - WIG 달성! 🎉

- [x] **WIG 목표 달성: 15/15 크롤러 90점 이상**
  - 2월 28일 목표 → 2월 18일 조기 달성
  - 전체 품질 점수: 94점
- [x] remote3.co 품질 개선 (80점 → 90점)
  - 위치 정보 추가 (Remote - US/EU/Global 등)
- [x] cryptocurrencyjobs.co 품질 개선 (89점 → 95점)
  - 86개 공고 위치 정보 추가
- [x] priority:greenhouse 품질 개선 (89점 → 94점)
  - 80개 공고 스킬 태그 추가
- [x] priority:lever 품질 개선 (88점 → 93점)
  - 11개 공고 스킬 태그 추가
- [x] jobs.solana.com JD backfill 스크립트 작성
  - Greenhouse, Ashby, Lever, Workable, Notion 지원
- [x] rocketpunch.com 크롤러 개선 (100점 달성)
  - 상세페이지 JD 크롤링 추가
  - 한국어 → 영어 번역 (description)
  - 원본 한국어 보존 (raw_description)
- [x] HTML 엔티티 클린업 마이그레이션 실행 (91개 정리)
- [x] Admin 4DX 대시보드에 크롤러 품질 테이블 추가
- [x] **E2E 테스트 설정** (Playwright)
  - playwright.config.ts 추가
  - e2e/jobs.spec.ts 테스트 작성
  - npm run test:e2e:playwright 스크립트 추가
- [x] **SEO 최적화**
  - 동적 OG 이미지 생성 (app/jobs/[id]/opengraph-image.tsx)
  - JSON-LD 구조화 데이터 (이미 구현됨)
- [x] **다크모드 컬러 수정**
  - Web3Badges, Blockies, ThumbnailUpload 수정
- [x] **Legacy status 필드 제거**
  - types/job.ts, prisma/schema.prisma 수정
  - API routes, scripts 업데이트
- [x] **이메일 알림 기능 구현**
  - job_alerts 테이블 마이그레이션
  - API: /api/alerts (CRUD)
  - hooks/useAlerts.ts
- [x] **지원 추적 기능 구현**
  - job_applications 테이블 마이그레이션
  - API: /api/applications (CRUD)
  - hooks/useApplications.ts
  - 상태 파이프라인: interested → applied → interview → offer

### February 2026 (Week 3)

- [x] 크롤러 안정화 작업
  - 공통 HTML 유틸 분리 (scripts/utils/htmlParser.ts)
  - 크롤러별 테스트 추가 (vitest)
  - npm run test:crawlers 스크립트 추가
- [x] JD HTML 엔티티 디코딩 버그 수정 (&lt;div&gt; → 정상 렌더링)
- [x] 크롤러 우회 (User-Agent rotation, Browser headers, Playwright)
- [x] Formatted/Raw 토글 복구 (raw_description 저장)
- [x] 리포트 기능 수정 (JobReport 테이블 생성)
- [x] CSRF 보호 적용 (report, bookmark API)

### February 2026 (Earlier)

- [x] VC BACKERS 섹션 렌더링 버그 수정 (JSON 파싱 이슈)
- [x] 프로젝트 문서화 (README, DATABASE, CRAWLERS)
- [x] .env.example 업데이트

### January 2026

- [x] Featured Jobs 자동 큐레이션 시스템
- [x] Trust Score 시스템 (VC 백커 기반)
- [x] 관리자 대시보드 완성
- [x] 뉴스레터 생성기
- [x] 한국어 번역 시스템 (AI 기반)
- [x] Job Description AI 요약

---

## In Progress

### High Priority

- [x] ~~**E2E 테스트 커버리지 확대**~~ ✅ 완료 (2026-02-18)
  - Playwright 설정 완료
  - 주요 플로우 테스트 작성

- [x] ~~**SEO 최적화**~~ ✅ 완료 (2026-02-18)
  - 동적 OG 이미지 생성
  - JSON-LD 구조화 데이터 (이미 구현됨)

### Medium Priority

- [x] ~~**크롤러 품질 90점 달성**~~ ✅ 완료 (2026-02-18)

- [ ] **크롤러 안정성 개선**
  - 프록시 로테이션
  - 재시도 로직 강화
  - 에러 모니터링 대시보드

- [ ] **성능 최적화**
  - ISR (Incremental Static Regeneration) 적용
  - API 응답 캐싱 개선

- [ ] **DB 마이그레이션 실행**
  - 002_email_alerts_and_applications.sql 적용 필요

---

## Backlog

### Features

#### User Features
- [x] 이메일 알림 (새 공고 매칭) ✅ API 완료
- [x] 지원 추적 기능 ✅ API 완료
- [ ] 이력서 업로드 & 자동 지원
- [ ] 사용자 프로필 페이지
- [ ] 공고 비교 기능
- [ ] 알림/지원 추적 UI 컴포넌트

#### Web3 Features
- [ ] NFT 기반 프리미엄 멤버십
- [ ] 토큰 게이팅 확대 (특정 공고 접근)
- [ ] 온체인 지원 이력 (POAP)
- [ ] DAO 투표로 Featured 선정

#### Company Features
- [ ] 회사 대시보드 (지원자 관리)
- [ ] 공고 직접 등록 기능
- [ ] 회사 프로필 페이지 개선
- [ ] 지원자 통계 대시보드

#### Content
- [ ] 아티클 섹션 확장
- [ ] 면접 팁 / 취업 가이드
- [ ] 연봉 정보 데이터베이스
- [ ] Web3 회사 리뷰 시스템

### Technical

#### Infrastructure
- [ ] Redis 캐싱 레이어
- [ ] CDN 이미지 최적화
- [ ] 에러 트래킹 (Sentry)
- [ ] 성능 모니터링 (Vercel Analytics)

#### Crawlers
- [ ] Wellfound (AngelList) 크롤러
- [ ] LinkedIn Jobs 크롤러
- [ ] Indeed 크롤러 (Web3 필터)
- [ ] 원티드 크롤러 개선
- [ ] 잡코리아 크롤러

#### Data Quality
- [ ] 중복 공고 자동 병합
- [ ] 회사명 정규화
- [x] 위치 정보 표준화 (Remote - Region 형식)
- [ ] 연봉 데이터 정규화
- [x] 스킬 태그 자동 추출

#### Security
- [ ] Rate Limiting 강화
- [ ] CAPTCHA 도입 (스팸 방지)
- [ ] 악성 URL 탐지

### Mobile

- [ ] PWA 개선 (오프라인 지원)
- [ ] 모바일 앱 (React Native)
- [ ] 푸시 알림

---

## Known Issues

### Bugs

| Issue | Priority | Status |
|-------|----------|--------|
| ~~JD HTML 엔티티 안 디코딩됨~~ | High | ✅ Fixed |
| ~~VC BACKERS 섹션 안 보임~~ | High | ✅ Fixed |
| ~~Formatted/Raw 토글 안 보임~~ | High | ✅ Fixed |
| ~~리포트 기능 DB 에러~~ | High | ✅ Fixed |
| ~~bookmarks 테이블 미생성~~ | High | ✅ Migration 존재 |
| 일부 크롤러 타임아웃 | Medium | ✅ Playwright 적용 |
| ~~다크모드 일부 컬러 불일치~~ | Low | ✅ Fixed |

### Technical Debt

- [x] ~~Legacy `status` 필드 제거 (`isActive`로 통합)~~ ✅ 완료
- [ ] 타입 정의 통합 (types/ 폴더 정리)
- [ ] 테스트 코드 리팩토링
- [ ] 사용하지 않는 dependencies 정리

---

## Release Notes

### v1.2.0 (Current - 2026-02-18)
- **E2E 테스트 설정** (Playwright)
- **동적 OG 이미지** 생성
- **이메일 알림 API** (job_alerts 테이블)
- **지원 추적 API** (job_applications 테이블)
- Legacy status 필드 제거
- 다크모드 컬러 수정

### v1.1.0 (2026-02-18)
- **15개 크롤러 활성화** (품질 점수 전원 90점 이상)
- Admin 4DX 대시보드 (WIG 추적)
- 크롤러 품질 지표 세분화
- rocketpunch.com 한국어 JD 번역 시스템
- jobs.solana.com JD backfill 지원

### v1.0.0 (2026-02)
- 12개 크롤러 활성화
- 지갑 연결 (MetaMask, WalletConnect, Coinbase)
- Job 검색 & 필터링
- 북마크 기능
- 관리자 대시보드
- Trust Score 시스템
- AI 요약 & 번역

### v1.3.0 (Planned)
- 알림/지원 추적 UI 컴포넌트
- 크롤러 안정성 개선 (프록시 로테이션)
- 성능 최적화 (ISR, 캐싱)

### v2.0.0 (Future)
- 회사 대시보드
- NFT 멤버십
- 모바일 앱

---

## Contributing

새로운 기능이나 버그 수정을 원하시면:

1. 이 파일의 Backlog에서 작업할 항목 선택
2. GitHub Issue 생성 (또는 기존 Issue 확인)
3. Feature branch 생성
4. PR 제출

---

## Notes

- 크롤러 추가 시 `docs/CRAWLERS.md` 업데이트 필요
- DB 스키마 변경 시 `docs/DATABASE.md` 업데이트 필요
- 환경변수 추가 시 `.env.example` 업데이트 필요
