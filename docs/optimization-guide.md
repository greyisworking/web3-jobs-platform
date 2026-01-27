# 성능 최적화 가이드 (Optimization Guide)

k6 부하 테스트 결과를 기반으로 적용할 수 있는 최적화 전략입니다.

---

## 1. 캐싱 전략

### 1.1 Redis / Upstash 캐싱

API 응답을 캐싱하여 DB 부하를 줄입니다.

**Upstash 설정 (서버리스 Redis):**

```bash
npm install @upstash/redis
```

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 캐시 래퍼 함수
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  // 캐시에서 조회
  const cachedData = await redis.get<T>(key)
  if (cachedData) return cachedData

  // 캐시 미스: DB에서 조회 후 캐시 저장
  const data = await fn()
  await redis.set(key, data, { ex: ttlSeconds })
  return data
}
```

**API에 적용:**

```typescript
// app/api/jobs/route.ts
import { cached } from '@/lib/cache'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'

  // 캐시 키: 쿼리 파라미터 기반
  const cacheKey = `jobs:${status}:${searchParams.toString()}`

  const result = await cached(cacheKey, 60, async () => { // 60초 TTL
    const supabase = await createSupabaseServerClient()
    // ... 기존 쿼리 로직
    return { jobs, stats }
  })

  return NextResponse.json(result)
}
```

**권장 TTL 설정:**

| 데이터 | TTL | 이유 |
|--------|-----|------|
| Job 목록 | 60초 | 크롤링 주기가 길어 자주 변하지 않음 |
| 통계 데이터 | 300초 | 집계 데이터는 실시간일 필요 없음 |
| 검색 결과 | 30초 | 검색은 다양하지만 결과는 자주 안 변함 |
| Job 상세 | 120초 | 개별 데이터는 거의 변하지 않음 |

---

### 1.2 Next.js ISR (Incremental Static Regeneration)

페이지 레벨 캐싱으로 빈번한 API 호출을 줄입니다.

```typescript
// app/page.tsx - ISR 적용
export const revalidate = 60 // 60초마다 재생성

async function getJobs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs`, {
    next: { revalidate: 60 }, // ISR: 60초
  })
  return res.json()
}
```

### 1.3 SWR 클라이언트 캐싱

```typescript
// 이미 프로젝트에서 SWR 사용 중
// hooks/use-jobs.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useJobs(status = 'active') {
  return useSWR(`/api/jobs?status=${status}`, fetcher, {
    revalidateOnFocus: false,    // 탭 전환 시 재요청 방지
    dedupingInterval: 30000,     // 30초 내 중복 요청 방지
    refreshInterval: 60000,      // 60초마다 자동 갱신
    keepPreviousData: true,      // 새 데이터 로딩 중 이전 데이터 표시
  })
}
```

---

## 2. 데이터베이스 최적화

### 2.1 Connection Pooling (Supabase PgBouncer)

Supabase는 기본적으로 PgBouncer를 제공합니다.

**설정 방법:**
1. Supabase 대시보드 → Settings → Database
2. Connection Pooling → Mode: `Transaction`
3. Pool Size: 기본 15, 필요시 증가

**연결 문자열 사용:**
```
# 직접 연결 (마이그레이션용)
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Pooled 연결 (애플리케이션용) — 이것을 사용
postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2.2 쿼리 최적화

**현재 문제점과 개선:**

```sql
-- 현재: 모든 컬럼 조회
SELECT * FROM "Job" WHERE status = 'active' ORDER BY "postedDate" DESC LIMIT 500;

-- 개선: 필요한 컬럼만 조회 (응답 크기 감소)
SELECT id, title, company, url, location, type, category,
       salary, tags, source, region, "postedDate"
FROM "Job"
WHERE status = 'active'
ORDER BY "postedDate" DESC
LIMIT 500;
```

**TypeScript 적용:**
```typescript
// 변경 전
const { data } = await supabase.from('Job').select('*')

// 변경 후: 필요한 컬럼만 선택
const { data } = await supabase
  .from('Job')
  .select('id, title, company, url, location, type, category, salary, tags, source, region, postedDate')
  .eq('status', 'active')
  .order('postedDate', { ascending: false })
  .limit(500)
```

### 2.3 인덱스 분석 및 추가

**기존 인덱스:**
```sql
-- migrations/004에서 생성됨
CREATE INDEX idx_jobs_status ON "Job"(status);

-- migrations/007에서 생성됨
CREATE INDEX idx_jobs_status ON "Job"(status);
CREATE INDEX idx_jobs_status_created ON "Job"(status, "crawledAt" DESC);
```

**추가 권장 인덱스:**
```sql
-- 검색 성능 향상 (Full-Text Search)
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON "Job" USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm ON "Job" USING gin (company gin_trgm_ops);

-- trigram 확장 필요
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 복합 인덱스: status + region (자주 사용되는 필터 조합)
CREATE INDEX IF NOT EXISTS idx_jobs_status_region ON "Job"(status, region);

-- 복합 인덱스: status + source
CREATE INDEX IF NOT EXISTS idx_jobs_status_source ON "Job"(status, source);

-- 복합 인덱스: status + postedDate (정렬에 사용)
CREATE INDEX IF NOT EXISTS idx_jobs_status_posted ON "Job"(status, "postedDate" DESC);
```

**인덱스 효과 확인:**
```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM "Job"
WHERE status = 'active'
ORDER BY "postedDate" DESC
LIMIT 500;

-- Index Scan이 표시되면 인덱스가 사용되고 있음
-- Seq Scan이 표시되면 인덱스가 없거나 사용되지 않음
```

---

## 3. API 응답 최적화

### 3.1 응답 압축

Next.js는 기본적으로 gzip을 지원하지만, 명시적으로 설정할 수 있습니다:

```javascript
// next.config.js
module.exports = {
  compress: true, // 기본값: true
}
```

### 3.2 페이지네이션

현재 500개 job을 한 번에 반환하는 것을 페이지네이션으로 변경:

```typescript
// app/api/jobs/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // 최대 100
  const offset = (page - 1) * limit

  const { data: jobs, count } = await supabase
    .from('Job')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('postedDate', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
```

### 3.3 통계 쿼리 병렬화

```typescript
// 변경 전: 순차 실행
const total = await supabase...count()
const global = await supabase...count()
const korea = await supabase...count()

// 변경 후: 병렬 실행 (이미 현재 구현에 적용됨)
const [totalResult, globalResult, koreaResult] = await Promise.all([
  supabase.from('Job').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  supabase.from('Job').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('region', 'Global'),
  supabase.from('Job').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('region', 'Korea'),
])
```

---

## 4. CDN 및 정적 자산 최적화

### 4.1 Vercel Edge Network (Vercel 배포 시)

Vercel은 자동으로 정적 자산을 Edge CDN에 배포합니다.

**API 응답 캐싱:**
```typescript
// 응답 헤더에 Cache-Control 추가
return new NextResponse(JSON.stringify({ jobs, stats }), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    // s-maxage=60: CDN에서 60초 캐시
    // stale-while-revalidate=300: 만료 후 300초간 stale 응답 허용
  },
})
```

### 4.2 이미지 최적화

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24시간
  },
}
```

---

## 5. 모니터링 및 알림

### 5.1 성능 모니터링 체크리스트

**매일 확인:**
- [ ] API 평균 응답 시간 < 200ms
- [ ] 에러율 < 0.1%
- [ ] DB 커넥션 사용률 < 80%

**매주 확인:**
- [ ] k6 부하 테스트 실행 및 결과 비교
- [ ] 느린 쿼리 Top 10 리뷰
- [ ] 디스크 사용량 확인

**월간 확인:**
- [ ] 스파이크 테스트 실행
- [ ] 인덱스 사용률 분석
- [ ] 캐시 적중률 확인

### 5.2 알림 기준

| 메트릭 | 경고 | 위험 |
|--------|------|------|
| API P95 | > 300ms | > 500ms |
| 에러율 | > 1% | > 5% |
| DB 커넥션 | > 70% | > 90% |
| 메모리 | > 70% | > 85% |

---

## 6. 최적화 우선순위

비용 대비 효과가 높은 순서로 적용하세요:

| 순위 | 최적화 | 난이도 | 효과 | 설명 |
|------|--------|--------|------|------|
| 1 | DB 인덱스 추가 | 낮음 | 높음 | SQL 한 줄로 즉시 효과 |
| 2 | SELECT 컬럼 지정 | 낮음 | 중간 | 응답 크기 감소 |
| 3 | API Cache-Control | 낮음 | 높음 | CDN 캐싱 활성화 |
| 4 | 페이지네이션 | 중간 | 높음 | 응답 크기 대폭 감소 |
| 5 | SWR 최적화 | 낮음 | 중간 | 클라이언트 중복 요청 방지 |
| 6 | Redis 캐싱 | 중간 | 높음 | DB 부하 대폭 감소 |
| 7 | ISR 적용 | 중간 | 높음 | 서버 부하 감소 |
| 8 | Full-Text Search | 높음 | 높음 | 검색 성능 개선 |
