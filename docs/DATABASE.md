# Database Schema

> NEUN Web3 Jobs Platform 데이터베이스 스키마 문서

## Overview

- **Production**: Supabase (PostgreSQL)
- **Development**: Prisma + SQLite (로컬) 또는 Supabase
- **ORM**: Prisma (로컬 개발용), Supabase Client (프로덕션)

## Tables

### Job (채용 공고)

메인 테이블. 모든 채용 공고 정보를 저장합니다.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary Key | `550e8400-e29b-41d4-a716-446655440000` |
| `title` | String | 직무명 | `Senior Solidity Developer` |
| `company` | String | 회사명 | `Uniswap Labs` |
| `location` | String | 위치 | `Remote, San Francisco` |
| `type` | String | 고용 형태 | `Full-time`, `Part-time`, `Contract` |
| `category` | String | 직무 카테고리 | `Engineering`, `Design`, `Marketing` |
| `role` | String? | 세부 역할 | `Engineering`, `Product`, `Design` |
| `description` | Text? | 상세 설명 (HTML/Markdown) | |
| `raw_description` | Text? | 원본 설명 (정제 전) | |
| `url` | String | 원본 공고 URL (UNIQUE) | |
| `salary` | String? | 연봉 문자열 | `$150k - $200k` |
| `salaryMin` | Integer? | 최소 연봉 (USD) | `150000` |
| `salaryMax` | Integer? | 최대 연봉 (USD) | `200000` |
| `salaryCurrency` | String? | 통화 | `USD`, `KRW` |
| `tags` | JSON? | 기술 스택 | `["Solidity", "React", "TypeScript"]` |
| `source` | String | 크롤링 소스 | `web3.career`, `cryptojobslist` |
| `region` | String | 지역 구분 | `Global`, `Korea` |
| `postedDate` | DateTime? | 게시일 | |
| `crawledAt` | DateTime | 크롤링 시각 | |
| `updatedAt` | DateTime | 마지막 수정 시각 | |
| `isActive` | Boolean | 활성 상태 | `true`, `false` |

#### Enhanced Job Details

| Column | Type | Description |
|--------|------|-------------|
| `requirements` | Text? | 자격 요건 (HTML/Markdown) |
| `responsibilities` | Text? | 업무 내용 (HTML/Markdown) |
| `benefits` | Text? | 복리후생 (HTML/Markdown) |
| `deadline` | DateTime? | 지원 마감일 |
| `experienceLevel` | String? | 경력 레벨 (`Junior`, `Mid`, `Senior`, `Lead`) |
| `remoteType` | String? | 근무 형태 (`Remote`, `Hybrid`, `Onsite`) |
| `companyLogo` | String? | 회사 로고 URL |
| `companyWebsite` | String? | 회사 웹사이트 URL |

#### Web3 Specific Fields (Supabase Only)

| Column | Type | Description |
|--------|------|-------------|
| `backers` | JSON? | VC 투자사 목록 | `["a16z", "Paradigm"]` |
| `sector` | String? | Web3 섹터 | `DeFi`, `NFT`, `Gaming` |
| `badges` | JSON? | 인증 뱃지 | `["Verified", "Pre-IPO"]` |
| `office_location` | String? | 오피스 위치 |
| `token_gate` | JSON? | 토큰 게이트 조건 |
| `is_dao_job` | Boolean? | DAO 채용 여부 |
| `is_alpha` | Boolean? | 알파 공고 여부 |
| `is_urgent` | Boolean? | 긴급 채용 |
| `is_featured` | Boolean? | Featured 표시 |
| `featured_score` | Integer? | Featured 점수 |
| `featured_pinned` | Boolean? | 고정 여부 |
| `featured_at` | DateTime? | Featured 등록 시각 |

#### User-Posted Job Fields

| Column | Type | Description |
|--------|------|-------------|
| `postedBy` | String? | 제출자 지갑 주소 |
| `reportCount` | Integer | 신고 횟수 (default: 0) |
| `isHidden` | Boolean | 숨김 처리 여부 (default: false) |

#### Indexes

```sql
CREATE INDEX idx_job_company ON "Job"(company);
CREATE INDEX idx_job_source ON "Job"(source);
CREATE INDEX idx_job_region ON "Job"(region);
CREATE INDEX idx_job_is_active ON "Job"("isActive");
CREATE INDEX idx_job_posted_date ON "Job"("postedDate");
CREATE INDEX idx_job_posted_by ON "Job"("postedBy");
CREATE INDEX idx_job_experience_level ON "Job"("experienceLevel");
CREATE INDEX idx_job_role ON "Job"(role);
```

---

### JobReport (채용 공고 신고)

사용자가 신고한 채용 공고 기록입니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `jobId` | UUID | FK → Job.id |
| `reporterWallet` | String? | 신고자 지갑 주소 |
| `reporterIp` | String? | 신고자 IP |
| `reason` | String | 신고 사유 |
| `createdAt` | DateTime | 신고 시각 |

#### Indexes
```sql
CREATE INDEX idx_job_report_job_id ON "JobReport"("jobId");
CREATE INDEX idx_job_report_reporter_wallet ON "JobReport"("reporterWallet");
CREATE INDEX idx_job_report_created_at ON "JobReport"("createdAt");
```

---

### WalletBlacklist (지갑 블랙리스트)

악성 사용자 지갑 주소를 관리합니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `wallet` | String | 지갑 주소 (UNIQUE) |
| `reason` | String? | 차단 사유 |
| `createdAt` | DateTime | 등록 시각 |

#### Indexes
```sql
CREATE UNIQUE INDEX idx_wallet_blacklist_wallet ON "WalletBlacklist"(wallet);
```

---

### CrawlLog (크롤링 로그)

크롤러 실행 기록입니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `source` | String | 크롤링 소스 |
| `status` | String | 실행 결과 (`success`, `failed`) |
| `jobCount` | Integer | 처리된 공고 수 |
| `error` | String? | 에러 메시지 |
| `createdAt` | DateTime | 실행 시각 |

#### Indexes
```sql
CREATE INDEX idx_crawl_log_source ON "CrawlLog"(source);
CREATE INDEX idx_crawl_log_created_at ON "CrawlLog"("createdAt");
```

---

## Supabase Additional Tables

Supabase에서 추가로 사용되는 테이블입니다.

### analytics_events (분석 이벤트)

사용자 행동 추적 테이블입니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `event_type` | String | 이벤트 타입 (`job_view`, `apply_click`, etc.) |
| `event_data` | JSON | 이벤트 데이터 |
| `session_id` | String? | 세션 ID |
| `user_agent` | String? | User Agent |
| `ip_address` | String? | IP 주소 |
| `created_at` | DateTime | 발생 시각 |

### search_logs (검색 로그)

검색 기록을 저장합니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `query` | String | 검색어 |
| `filters` | JSON? | 적용된 필터 |
| `result_count` | Integer | 검색 결과 수 |
| `created_at` | DateTime | 검색 시각 |

### bookmarks (북마크)

사용자 북마크 정보입니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `wallet_address` | String | 지갑 주소 |
| `job_id` | UUID | FK → Job.id |
| `created_at` | DateTime | 등록 시각 |

### trust_reports (신뢰도 리포트)

회사 신뢰도 리포트 정보입니다.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `company_name` | String | 회사명 |
| `report_type` | String | 리포트 타입 |
| `reporter_wallet` | String? | 제출자 지갑 |
| `details` | JSON? | 상세 정보 |
| `created_at` | DateTime | 등록 시각 |

---

## Entity Relationship Diagram

```
┌─────────────────┐
│      Job        │
├─────────────────┤
│ id (PK)         │
│ title           │
│ company         │
│ ...             │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   JobReport     │
├─────────────────┤
│ id (PK)         │
│ jobId (FK)      │
│ reason          │
│ ...             │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ WalletBlacklist │     │    CrawlLog     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ wallet (UNIQUE) │     │ source          │
│ reason          │     │ status          │
│ ...             │     │ ...             │
└─────────────────┘     └─────────────────┘
```

---

## Migrations

### Prisma (로컬 개발)

```bash
# 스키마 변경 후 적용
npx prisma db push

# 마이그레이션 생성
npx prisma migrate dev --name add_new_field

# 마이그레이션 적용 (프로덕션)
npx prisma migrate deploy
```

### Supabase

마이그레이션 파일은 `supabase/migrations/` 디렉토리에 저장됩니다.

```bash
# 마이그레이션 생성
supabase migration new add_new_table

# 로컬에 적용
supabase db reset

# 프로덕션에 적용
supabase db push
```

---

## Data Types Reference

| TypeScript | Prisma | PostgreSQL |
|------------|--------|------------|
| `string` | `String` | `TEXT` / `VARCHAR` |
| `number` | `Int` | `INTEGER` |
| `boolean` | `Boolean` | `BOOLEAN` |
| `Date` | `DateTime` | `TIMESTAMP` |
| `object` | `Json` | `JSONB` |
| `string` (UUID) | `String @id` | `UUID` |

---

## Best Practices

1. **Always use `isActive` filter**: 만료된 공고 제외
   ```sql
   SELECT * FROM "Job" WHERE "isActive" = true
   ```

2. **Use `crawledAt` for freshness**: 최근 공고 우선
   ```sql
   ORDER BY "crawledAt" DESC
   ```

3. **Parse JSON fields**: `backers`, `tags`, `badges`는 JSON 파싱 필요
   ```typescript
   const backers = JSON.parse(job.backers || '[]')
   ```

4. **Soft delete**: 데이터 삭제 시 `isActive = false` 사용
