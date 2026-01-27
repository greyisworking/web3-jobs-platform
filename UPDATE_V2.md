# 🚀 Version 2 업데이트 가이드

## ✨ 새로운 기능

### 추가된 크롤러 (총 11개)

**Tier 1 (기존):**
- ✅ web3.career
- ✅ web3jobs.cc
- ✅ web3kr.jobs

**Tier 2 (신규 추가 - 글로벌):**
- 🆕 CryptoJobsList
- 🆕 Remote3.co
- 🆕 RemoteOK

**Tier 2 (신규 추가 - 한국):**
- 🆕 로켓펀치 (RocketPunch)
- 🆕 잡코리아 (JobKorea)

**Tier 3 (신규 추가 - 생태계):**
- 🆕 Sui Jobs
- 🆕 Solana Jobs
- 🆕 Ethereum Foundation

## 📦 업데이트 방법

### 방법 1: 새 프로젝트 다운로드 (권장)

1. **새 파일 다운로드**
   ```bash
   # Downloads 폴더에서
   tar -xzf web3-jobs-platform-v2.tar.gz
   cd web3-jobs-platform
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **데이터베이스 초기화** (기존 데이터 유지하려면 건너뛰기)
   ```bash
   npx prisma db push
   ```

4. **크롤링 실행**
   ```bash
   npm run crawl
   ```

5. **서버 시작**
   ```bash
   npm run dev
   ```

### 방법 2: 기존 프로젝트 업데이트

기존 프로젝트 폴더에서:

1. **크롤러 파일들만 복사**
   - `scripts/crawlers/` 폴더의 새 파일들 복사
   - `scripts/crawl.ts` 파일 교체

2. **크롤링 실행**
   ```bash
   npm run crawl
   ```

## 🎯 예상 결과

### 이전 (3개 사이트):
- 전체: ~57개
- 글로벌: ~46개
- 국내: ~11개

### 이후 (11개 사이트):
- 전체: **150-300개** (예상)
- 글로벌: **100-200개** (예상)
- 국내: **50-100개** (예상)

## 🔍 크롤러 세부 정보

### 글로벌 사이트
- **CryptoJobsList**: 암호화폐 전문 채용
- **Remote3.co**: 원격 Web3 직무
- **RemoteOK**: 원격 근무 플랫폼

### 한국 사이트
- **로켓펀치**: 스타트업 채용 (블록체인 필터)
- **잡코리아**: 대형 채용 사이트 (Web3.0 검색)

### 생태계 사이트
- **Sui**: Layer 1 블록체인
- **Solana**: 고성능 블록체인
- **Ethereum**: 이더리움 재단

## 📊 사이트별 통계 확인

크롤링 후 메인 페이지에서 확인:
- **전체 공고 수**
- **글로벌 vs 국내**
- **사이트별 공고 수**

## ⚠️ 주의사항

1. **Rate Limiting**
   - 각 크롤러는 0.1초 delay 적용
   - 전체 크롤링에 5-10분 소요

2. **실패 가능성**
   - 일부 사이트는 구조 변경으로 실패 가능
   - 에러가 나도 다른 사이트는 계속 크롤링

3. **데이터 품질**
   - 사이트마다 구조가 달라 파싱 정확도 차이
   - 지속적인 업데이트 필요

## 🔜 다음 업데이트 예정

**Phase 3 (20개 추가):**
- Wellfound
- Braintrust
- Avalanche Jobs
- Base Jobs
- Arbitrum Jobs
- 그 외 15개...

**Phase 4 (고급 기능):**
- 필터링 & 검색
- 알림 시스템
- 자동 스케줄링
- API 개발

## 💬 피드백

문제가 있거나 제안사항이 있으면:
1. GitHub Issues 등록
2. 커뮤니티 포럼 문의

---

Made with ❤️ for Web3 Community
