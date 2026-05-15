# NEUN 방치 후 복귀 가이드

> 5주든 6개월이든, 오랜만에 돌아왔을 때 보는 문서.
> 2026-05-14 첫 복귀 때 실제로 겪은 순서 그대로 정리했다.
> 순서가 중요하다. 건너뛰지 말 것.

---

## Phase 1: 인프라부터 확인

DB 없이는 아무것도 안 되니까 제일 먼저 본다.

### 1-1. Supabase 대시보드 접속

```
https://supabase.com/dashboard/projects
```

- [ ] 프로젝트 상태 확인 (Active / Paused / Restoring)
- [ ] **Paused면 Resume 버튼** 누르기 — 무료 플랜은 7일 비활성 시 자동 pause됨
- [ ] Resume 누른 후 restore 완료까지 수 분~수십 분 소요

> 왜 이걸 먼저 하냐면, restore 시간이 걸리니까 일찍 트리거할수록 뒤에서 다른 거 하면서 기다릴 수 있다.

### 1-2. Supabase 키 확인

Settings → API 에서:

- [ ] **Project URL** — `.env`의 `NEXT_PUBLIC_SUPABASE_URL`과 일치하는지
- [ ] **anon key** — `.env`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`와 일치하는지
- [ ] **service_role key** — `.env`의 `SUPABASE_SERVICE_ROLE_KEY`와 일치하는지

> restore 후 URL이나 키가 바뀔 수 있다 (프로젝트 ref가 달라지는 경우).
> JWT 안에 `ref` 값이 포함돼 있어서, URL만 바꾸고 키를 안 바꾸면 인증 실패한다.

키가 바뀌었으면 `.env` 업데이트:

```bash
# .env 파일 직접 편집
vi .env
# 또는 Claude Code에서 수정
```

### 1-3. DB 복원 상태 폴링

restore가 진행 중이면 테이블이 아직 없다. 폴링 스크립트로 확인:

```bash
npx tsx scripts/poll-restore.ts
```

15초마다 Job, JobReport, bookmarks 테이블 존재 여부를 체크한다.
`All tables restored!` 뜨면 다음 단계로.

> 주의: Supabase REST API는 테이블이 없어도 `select count`에서 에러 대신 null을 반환하는 경우가 있다.
> 폴링 스크립트는 `select * limit 1`로 실제 데이터 접근을 시도해서 PGRST205 에러를 잡는다.

---

## Phase 2: 로컬 환경 진단

인프라 복원 기다리면서 할 수 있는 것들.

### 2-1. 마지막 작업 시점 확인

```bash
git log --oneline -20 --format="%h %ai %s"
```

> 얼마나 방치했는지 감 잡고, 마지막에 뭘 하다 멈췄는지 확인한다.

### 2-2. 의존성 상태 체크

```bash
npm install          # lockfile 기준 설치
npm outdated         # 업데이트 가능한 패키지 목록
npm audit            # 보안 취약점
```

> 여기서 중요한 건 "지금 당장 고칠 것"과 "나중에 고칠 것"을 구분하는 것이다.

### 2-3. 환경변수 diff

```bash
# .env.example에는 있는데 .env에 없는 키 찾기
diff <(grep -E '^[A-Z_]' .env.example | sed 's/=.*//' | sort) \
     <(grep -E '^[A-Z_]' .env | sed 's/=.*//' | sort)
```

> 누가(= 과거의 나) .env.example은 업데이트 안 하고 .env에만 키를 추가해놨을 수 있다.

---

## Phase 3: 정상화 (메이저 업데이트 금지)

**원칙: 먼저 돌아가게 만들고, 개선은 나중에.**

### 3-1. dev 서버 구동 확인

```bash
npm run dev
```

- [ ] 컴파일 에러 없이 뜨는지
- [ ] `localhost:3000` 접속되는지
- [ ] Sentry 경고는 무시해도 됨 (동작에 영향 없음)

> DB 없어도 빌드 자체는 되어야 한다. 여기서 터지면 코드 문제다.

### 3-2. Supabase 연결 테스트

DB 복원 완료 후:

```bash
npx tsx scripts/check-db-status.ts
```

이 스크립트가 보여주는 것:
- 총 잡 수 / 활성 / 비활성
- 소스별 마지막 크롤링 시각
- 활성/비활성 잡 샘플

> anon key와 service_role key 둘 다 동작하는지 확인하려면:

```bash
npx tsx -e "
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const sbAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
sbAnon.from('Job').select('id').limit(1).then(({ error }) => {
  console.log('[anon]', error ? 'FAIL: ' + error.message : 'OK')
})

const sbService = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
sbService.from('Job').select('id').limit(1).then(({ error }) => {
  console.log('[service]', error ? 'FAIL: ' + error.message : 'OK')
})
"
```

### 3-3. 크롤러 dry-run

가벼운 것부터 순서대로 테스트:

```bash
# 1. RemoteOK — JSON API, 가장 단순
npx tsx -e "import 'dotenv/config'; import { crawlRemoteOK } from './scripts/crawlers/remoteok'; crawlRemoteOK().then(r => console.log(r))"

# 2. Wanted — 한국 소스 확인
npx tsx -e "import 'dotenv/config'; import { crawlWanted } from './scripts/crawlers/wanted'; crawlWanted().then(r => console.log(r))"

# 3. 전체 크롤러
npm run crawl
```

> RemoteOK는 단순 JSON fetch라서 외부 의존성이 없다. 이걸로 "크롤러 → 파싱 → DB 저장" 파이프라인이 살아있는지 확인.
> Wanted는 한국 소스 + HTML 파싱이라 난이도가 살짝 높다.

### 3-4. 만료 잡 정리

```bash
npm run check:expired:stats   # 통계만 먼저
npm run check:expired         # 실제 정리
```

### 3-5. npm audit fix (--force 없이)

```bash
npm audit fix
```

> `--force`는 절대 쓰지 않는다. 메이저 버전 올려버려서 빌드 깨진다.
> fix로 안 되는 건 메이저 업데이트 브랜치에서 처리.

---

## Phase 4: 메이저 업데이트 (별도 브랜치)

```bash
git checkout -b next-16-migration   # 예시
```

> 정상화 완료 후에만 진행. main에서 직접 하지 않는다.
> 2026-05-14 기준 대기 중인 메이저 업데이트:
> - `next` 15 → 16 (App Router 변경 많음)
> - `@prisma/client` 6 → 7
> - `lucide-react` 0.x → 1.x (import 경로 변경)
> - `@vercel/analytics` 1 → 2
> - `eslint` 8 → 10

---

## 자주 빠뜨리는 환경변수

| 변수 | 용도 | 생성 방법 | Vercel 동기화 |
|------|------|----------|:---:|
| `CRON_SECRET` | Vercel Cron 인증 (3개 API route에서 Bearer 검증) | `openssl rand -base64 32` | **필수** |
| `DISCORD_WEBHOOK_URL` | 크롤 결과/에러 알림 | Discord 채널 설정 → Integrations → Webhooks | **필수** |
| `ADMIN_PASSWORD` | `/admin` 대시보드 접근 | 아무 문자열 | 필수 |
| `ANTHROPIC_API_KEY` | AI 번역, 리포트 생성 | Anthropic Console | 필수 |

### CRON_SECRET이 검증되는 곳

```
app/api/cron/crawl/route.ts         → Bearer 헤더 검증
app/api/cron/newsletter/route.ts    → Bearer 헤더 검증
app/api/cron/cleanup-expired/route.ts → Bearer 헤더 검증
```

> Vercel Cron이 이 API를 호출할 때 `Authorization: Bearer <CRON_SECRET>` 헤더를 보낸다.
> 로컬에서 CRON_SECRET 없으면 검증을 건너뛴다 (`if (cronSecret && ...)` 조건).

### Vercel 환경변수 동기화 필수 목록

Supabase 키가 바뀌면 Vercel에도 반영해야 한다:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
DISCORD_WEBHOOK_URL
ANTHROPIC_API_KEY
```

Vercel 대시보드: Settings → Environment Variables

---

## Restore 중 할 수 있는 것 / 못 하는 것

| 할 수 있다 | 못 한다 |
|---|---|
| `npm install`, `npm run dev` (빌드 확인) | 크롤러 실행 (DB 저장 불가) |
| `npm outdated`, `npm audit` | `check-db-status.ts` (데이터 없음) |
| `.env` 업데이트, 환경변수 세팅 | 만료 잡 정리 |
| 코드 리뷰, 리팩토링 | Vercel 배포 (DB 연결 실패) |
| `git log` 히스토리 확인 | |
| Sentry/Discord 설정 | |

---

## 유용한 스크립트 모음

```bash
# DB 상태 전체 확인 (총 잡 수, 소스별 마지막 크롤링)
npx tsx scripts/check-db-status.ts

# DB 복원 대기 폴링 (15초 간격)
npx tsx scripts/poll-restore.ts

# 만료 잡 통계
npm run check:expired:stats

# 크롤러 전체 실행
npm run crawl

# 스케줄러 (3시간 간격 자동 크롤링)
npm run schedule

# dev 서버 + 스케줄러 동시 실행
npm run dev:all
```

---

## 타임라인 (참고용)

| 날짜 | 사건 |
|------|------|
| 2026-04-09 | 마지막 커밋 (크롤러 리팩토링 완료) |
| 2026-05-14 | 첫 복귀 — Supabase paused, restore 진행, .env 키 전부 교체 |

> 다음에 돌아올 때 이 줄 아래에 추가하면 된다.
