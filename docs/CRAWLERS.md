# Crawlers Guide

> NEUN Web3 Jobs Platform 크롤러 목록 및 사용 가이드

## Overview

17개 채용 사이트에서 Web3/블록체인 관련 채용 공고를 자동으로 수집합니다.

**실행 방법:**
```bash
npm run crawl
```

**스케줄러 실행:**
```bash
npm run schedule        # 크론 스케줄러
npm run dev:all         # 개발 서버 + 스케줄러 동시 실행
```

---

## Crawler List

### Tier 1: Priority Sources (높은 우선순위)

| Crawler | Source | Region | Description |
|---------|--------|--------|-------------|
| `priority-companies` | 다중 | Global | VC 포트폴리오 회사 직접 크롤링 |
| `web3career` | web3.career | Global | 최대 Web3 채용 플랫폼 |
| `web3krjobs` | web3kr.jobs | Korea | 한국 Web3 전문 채용 |
| `cryptojobslist` | cryptojobslist.com | Global | 크립토 전문 채용 사이트 |
| `cryptocurrencyjobs` | cryptocurrencyjobs.co | Global | 700+ 크립토 채용 공고 |

### Tier 2: General Web3 (일반 Web3)

| Crawler | Source | Region | Description |
|---------|--------|--------|-------------|
| `remote3` | remote3.co | Global | 리모트 Web3 채용 전문 |
| `remoteok` | remoteok.com | Global | 리모트 전문 (Web3 필터) |
| `rocketpunch` | rocketpunch.com | Korea | 한국 스타트업 채용 (블록체인 필터) |
| `cryptojobs` | crypto.jobs | Global | Web3 전문 채용 (3500+ 공고) |
| `wellfound` | wellfound.com | Global | 스타트업 채용 (구 AngelList) |
| `superteam` | talent.superteam.fun | Global | Solana 생태계 바운티/채용 |

### Tier 3: Ecosystem Jobs (생태계별)

| Crawler | Source | Region | Description |
|---------|--------|--------|-------------|
| `suijobs` | jobs.sui.io | Global | Sui Foundation 공식 |
| `solanajobs` | jobs.solana.com | Global | Solana Foundation 공식 |
| `ethereum` | ethereum.foundation | Global | Ethereum Foundation 공식 |
| `avalanchejobs` | jobs.avax.network | Global | Avalanche Foundation 공식 |
| `arbitrumjobs` | jobs.arbitrum.io | Global | Arbitrum Foundation 공식 |
| `basehirechain` | base.hirechain.io | Global | Base (L2) 생태계 채용 |

### ATS Platform Crawlers (채용 플랫폼)

`scripts/crawlers/platforms/` 디렉토리에 위치

| Crawler | Platform | Description |
|---------|----------|-------------|
| `getro` | Getro | VC 포트폴리오 채용 플랫폼 |
| `greenhouse` | Greenhouse | 기업용 ATS |
| `lever` | Lever | 기업용 ATS |
| `ashby` | Ashby | 기업용 ATS |

---

## Crawler Architecture

```
scripts/
├── crawl.ts                    # 메인 진입점
├── scheduler.ts                # 크론 스케줄러
├── utils.ts                    # 공통 유틸리티
├── crawlers/
│   ├── web3career.ts           # web3.career 크롤러
│   ├── web3krjobs.ts           # web3kr.jobs 크롤러
│   ├── cryptojobslist.ts       # cryptojobslist 크롤러
│   ├── remote3.ts              # remote3.co 크롤러
│   ├── remoteok.ts             # remoteok.com 크롤러
│   ├── rocketpunch.ts          # rocketpunch.com 크롤러
│   ├── suijobs.ts              # Sui jobs 크롤러
│   ├── solanajobs.ts           # Solana jobs 크롤러
│   ├── ethereum.ts             # Ethereum Foundation 크롤러
│   ├── cryptocurrencyjobs.ts   # cryptocurrencyjobs.co 크롤러
│   ├── cryptojobs.ts           # crypto.jobs 크롤러
│   ├── wellfound.ts            # wellfound.com 크롤러
│   ├── superteam.ts            # Superteam Earn 크롤러
│   ├── basehirechain.ts        # Base Hirechain 크롤러
│   ├── avalanchejobs.ts        # Avalanche jobs 크롤러
│   ├── arbitrumjobs.ts         # Arbitrum jobs 크롤러
│   ├── priority-companies.ts   # VC 포트폴리오 회사 크롤러
│   ├── platforms/
│   │   ├── index.ts            # 플랫폼 크롤러 인덱스
│   │   ├── getro.ts            # Getro ATS 크롤러
│   │   ├── greenhouse.ts       # Greenhouse ATS 크롤러
│   │   ├── lever.ts            # Lever ATS 크롤러
│   │   └── ashby.ts            # Ashby ATS 크롤러
│   └── utils/
│       └── ...                 # 크롤러 유틸리티
└── utils/
    └── ...                     # 공통 유틸리티
```

---

## How Crawlers Work

### 1. Basic Flow

```
1. fetchHTML(url)          → HTML 페이지 가져오기
2. parse($)                → Cheerio로 데이터 추출
3. fetchJobDetails(url)    → 상세 페이지 추가 크롤링
4. validateAndSaveJob()    → 유효성 검사 후 저장
5. logCrawlResult()        → 크롤링 결과 로깅
```

### 2. Return Type

모든 크롤러는 다음 형태를 반환합니다:

```typescript
interface CrawlerReturn {
  total: number   // 전체 처리 건수
  new: number     // 신규 추가 건수
}
```

### 3. Rate Limiting

각 크롤러는 Rate Limit을 준수합니다:

```typescript
await delay(500)   // 페이지 간 500ms 딜레이
await delay(300)   // 상세 페이지 간 300ms 딜레이
```

---

## Creating a New Crawler

### Template

```typescript
// scripts/crawlers/newsite.ts
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

export async function crawlNewSite(): Promise<CrawlerReturn> {
  console.log('🚀 Starting NewSite crawler...')

  const baseUrl = 'https://newsite.com/jobs'
  const $ = await fetchHTML(baseUrl)

  if (!$) {
    console.error('❌ Failed to fetch NewSite')
    return { total: 0, new: 0 }
  }

  const jobs: any[] = []

  // Parse job listings
  $('.job-item').each((_, el) => {
    const title = cleanText($(el).find('.title').text())
    const company = cleanText($(el).find('.company').text())
    const url = $(el).find('a').attr('href')

    if (title && url) {
      jobs.push({ title, company, url })
    }
  })

  console.log(`📦 Found ${jobs.length} jobs`)

  let savedCount = 0
  let newCount = 0

  for (const job of jobs) {
    const result = await validateAndSaveJob({
      title: job.title,
      company: job.company,
      url: job.url,
      location: 'Remote',
      type: 'Full-time',
      category: 'Engineering',
      source: 'newsite',
      region: 'Global',
    }, 'newsite')

    if (result.saved) savedCount++
    if (result.isNew) newCount++

    await delay(100)
  }

  // Log crawl result
  await supabase.from('CrawlLog').insert({
    source: 'newsite',
    status: 'success',
    jobCount: savedCount,
  })

  console.log(`✅ Saved ${savedCount} jobs (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
```

### Register in Main Crawler

```typescript
// scripts/crawl.ts
import { crawlNewSite } from './crawlers/newsite'

const crawlers = [
  // ... existing crawlers
  { name: 'newsite.com', fn: crawlNewSite },
]
```

---

## Utility Functions

### `scripts/utils.ts`

| Function | Description |
|----------|-------------|
| `fetchHTML(url)` | URL에서 HTML 가져와 Cheerio 객체 반환 |
| `delay(ms)` | 지정 시간 대기 |
| `cleanText(text)` | 공백/개행 정리 |
| `extractHTML(el, $)` | 요소의 HTML 추출 |
| `parseSalary(text)` | 연봉 문자열 파싱 → { min, max, currency } |
| `detectExperienceLevel(text)` | 경력 레벨 감지 |
| `detectRemoteType(text)` | 근무 형태 감지 |

### `lib/validations/validate-job.ts`

```typescript
interface ValidateResult {
  saved: boolean
  isNew: boolean
  error?: string
}

validateAndSaveJob(jobData, source): Promise<ValidateResult>
```

---

## Discord Notifications

크롤링 시작/완료/실패 시 Discord 웹훅으로 알림을 전송합니다.

**환경변수 설정:**
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**알림 내용:**
- 🚀 크롤링 시작
- ✅ 크롤링 완료 (새 공고 수, 전체 처리 수)
- ❌ 크롤링 실패 (에러 메시지)

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | 사이트 접근 불가 | 프록시 사용 또는 User-Agent 변경 |
| `Rate limited` | 요청 너무 빠름 | `delay()` 시간 증가 |
| `Empty results` | HTML 구조 변경 | 셀렉터 업데이트 |
| `Duplicate jobs` | URL 중복 | URL 정규화 확인 |

### Debug Mode

```bash
# 특정 크롤러만 테스트
npx tsx scripts/crawlers/web3career.ts

# 드라이런 (저장하지 않고 테스트)
npx tsx scripts/test-crawler.ts --source=web3career --dry-run
```

---

## Cron Schedule

### Vercel Cron

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/crawl",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### GitHub Actions

`.github/workflows/crawl.yml`:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다
  workflow_dispatch:        # 수동 실행

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run crawl
```

### Local Scheduler

```bash
npm run schedule
```

`scripts/scheduler.ts`에서 node-cron 사용:
```typescript
cron.schedule('0 */6 * * *', async () => {
  await runAllCrawlers()
})
```

---

## Performance Tips

1. **병렬 처리 지양**: Rate limit 때문에 순차 처리 권장
2. **상세 페이지 최소화**: 필수 정보만 추가 크롤링
3. **캐싱 활용**: 이미 존재하는 URL은 스킵
4. **에러 핸들링**: 개별 크롤러 실패가 전체에 영향 주지 않도록
5. **로깅**: 디버깅을 위한 충분한 로그 출력
