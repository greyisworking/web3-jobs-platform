# TODO - NEUN Web3 Jobs Platform

> 현재 진행 상황 및 백로그

Last Updated: 2026-02-16 16:30 KST

---

## Current Status

| Category | Status | Progress |
|----------|--------|----------|
| Core Features | ✅ Complete | 100% |
| Crawlers | ✅ Complete | 12/12 active |
| UI/UX | ✅ Complete | Production ready |
| Admin Dashboard | ✅ Complete | Fully functional |
| Web3 Integration | ✅ Complete | Wallet connection working |
| AI Features | ✅ Complete | Claude integration |
| DB Tables | ⚠️ Partial | bookmarks 테이블 필요 |
| Testing | ⚠️ Partial | Unit/API tests done |
| Documentation | 🔄 In Progress | 80% |

### Live Stats (2026-02-16)
- Total Active Jobs: **1,300**
- Jobs with Description: **1,268**
- Jobs with Raw Description: **1,086**

---

## Recently Completed

### February 2026 (Week 3)

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

- [ ] **E2E 테스트 커버리지 확대**
  - Playwright 기반 주요 플로우 테스트
  - Job 검색 → 상세 → 지원 플로우

- [ ] **SEO 최적화**
  - 동적 OG 이미지 생성
  - 구조화된 데이터 (JSON-LD) 개선

### Medium Priority

- [ ] **크롤러 안정성 개선**
  - 프록시 로테이션
  - 재시도 로직 강화
  - 에러 모니터링 대시보드

- [ ] **성능 최적화**
  - ISR (Incremental Static Regeneration) 적용
  - API 응답 캐싱 개선

---

## Backlog

### Features

#### User Features
- [ ] 이메일 알림 (새 공고 매칭)
- [ ] 지원 추적 기능
- [ ] 이력서 업로드 & 자동 지원
- [ ] 사용자 프로필 페이지
- [ ] 공고 비교 기능

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
- [ ] 위치 정보 표준화
- [ ] 연봉 데이터 정규화

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
| bookmarks 테이블 미생성 | High | ⚠️ SQL 실행 필요 |
| 일부 크롤러 타임아웃 | Medium | ✅ Playwright 적용 |
| 다크모드 일부 컬러 불일치 | Low | Backlog |

### Technical Debt

- [ ] Legacy `status` 필드 제거 (`isActive`로 통합)
- [ ] 타입 정의 통합 (types/ 폴더 정리)
- [ ] 테스트 코드 리팩토링
- [ ] 사용하지 않는 dependencies 정리

---

## Release Notes

### v1.0.0 (Current)
- 12개 크롤러 활성화
- 지갑 연결 (MetaMask, WalletConnect, Coinbase)
- Job 검색 & 필터링
- 북마크 기능
- 관리자 대시보드
- Trust Score 시스템
- AI 요약 & 번역

### v1.1.0 (Planned)
- 이메일 알림
- 지원 추적
- 크롤러 안정성 개선
- SEO 최적화

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
