# 성능 분석 가이드 (Performance Analysis Guide)

k6 부하 테스트 결과를 분석하고 병목 지점을 식별하는 방법을 설명합니다.

---

## 1. k6 결과 읽는 방법

### 핵심 메트릭

| 메트릭 | 설명 | 목표값 |
|--------|------|--------|
| `http_req_duration` | 요청 응답 시간 | P95 < 500ms, P99 < 1000ms |
| `http_req_failed` | 실패한 요청 비율 | < 1% |
| `http_reqs` | 초당 처리 요청 수 (RPS) | 높을수록 좋음 |
| `vus` | 동시 가상 사용자 수 | 테스트 설정에 따라 다름 |
| `http_req_waiting` | 서버 처리 시간 (TTFB) | < 200ms |
| `http_req_connecting` | TCP 연결 시간 | < 50ms |

### 응답 시간 백분위수 해석

```
P50 (중앙값): 절반의 요청이 이 시간 이내 완료
P90: 90%의 요청이 이 시간 이내 완료
P95: 95%의 요청이 이 시간 이내 완료 (주요 SLA 기준)
P99: 99%의 요청이 이 시간 이내 완료 (최악의 경우)
```

### 결과 예시 분석

```
http_req_duration:
  avg=120ms  min=45ms  med=95ms  max=2500ms  p(90)=250ms  p(95)=450ms  p(99)=980ms
```

해석:
- **평균 120ms**: 전반적으로 양호
- **P95 450ms**: 500ms 목표 이내 → PASS
- **P99 980ms**: 1000ms 목표 이내 → PASS
- **최대 2500ms**: 일부 느린 요청 존재 → 조사 필요

---

## 2. 병목 지점 식별

### 2.1 데이터베이스 병목

**증상:**
- `http_req_waiting` (TTFB)이 비정상적으로 높음 (> 300ms)
- VU 증가에 따라 응답 시간이 선형적으로 증가
- 특정 쿼리(검색, 필터)에서만 느림

**진단 방법:**
```
1. Supabase 대시보드 → Database → Query Performance
2. 느린 쿼리 확인: pg_stat_statements에서 mean_time 높은 순 정렬
3. 실행 계획 확인: EXPLAIN ANALYZE SELECT * FROM "Job" WHERE status='active'
```

**Supabase 대시보드 체크리스트:**
- [ ] Database → Reports → Slow Queries 확인
- [ ] Database → Usage → Connection 수 확인 (풀 소진 여부)
- [ ] Database → Indexes → 사용되지 않는 인덱스 확인
- [ ] Database → Roles → 현재 활성 연결 수 확인

**SQL 진단 쿼리:**
```sql
-- 느린 쿼리 Top 10
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 인덱스 사용률 확인
SELECT relname, idx_scan, seq_scan, idx_scan::float / (idx_scan + seq_scan) as idx_ratio
FROM pg_stat_user_tables
WHERE (idx_scan + seq_scan) > 0
ORDER BY idx_ratio ASC;

-- 현재 활성 쿼리 확인
SELECT pid, state, query, now() - query_start as duration
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

### 2.2 CPU / 메모리 병목

**증상:**
- 모든 엔드포인트에서 고르게 느림
- VU 증가에 따라 급격한 성능 저하
- 서버 에러(5xx) 증가

**진단 방법:**
```bash
# 서버 리소스 모니터링
top -l 1 | head -10          # macOS
htop                          # Linux

# Node.js 프로세스 메모리 확인
ps aux | grep node | head -5

# 포트별 연결 수 확인
lsof -i :3000 | wc -l
```

**체크리스트:**
- [ ] CPU 사용률 > 80% 여부
- [ ] 메모리 사용률 > 80% 여부
- [ ] Node.js 힙 메모리 크기 확인 (--max-old-space-size)
- [ ] Event Loop 지연 여부

### 2.3 API 로직 병목

**증상:**
- `http_req_waiting`은 낮은데 `http_req_duration`이 높음
- 특정 엔드포인트에서만 발생
- JSON 직렬화 시간이 김

**진단 방법:**
```typescript
// API 핸들러에 타이밍 로그 추가
export async function GET(request: Request) {
  const start = performance.now()

  const t1 = performance.now()
  const { data: jobs } = await supabase.from('Job').select('*')...
  console.log(`DB 쿼리: ${(performance.now() - t1).toFixed(2)}ms`)

  const t2 = performance.now()
  const stats = await getStats()
  console.log(`통계 쿼리: ${(performance.now() - t2).toFixed(2)}ms`)

  const t3 = performance.now()
  const response = NextResponse.json({ jobs, stats })
  console.log(`JSON 직렬화: ${(performance.now() - t3).toFixed(2)}ms`)

  console.log(`총 처리 시간: ${(performance.now() - start).toFixed(2)}ms`)
  return response
}
```

**체크리스트:**
- [ ] N+1 쿼리 문제 확인 (반복문 안의 DB 호출)
- [ ] 불필요한 데이터 조회 (SELECT * 대신 필요한 컬럼만)
- [ ] 동기 처리를 비동기로 변경 가능 여부
- [ ] JSON 응답 크기 확인 (500개 job이 너무 큰 payload인지)

### 2.4 네트워크 병목

**증상:**
- `http_req_connecting`이 높음 (> 100ms)
- `http_req_tls_handshaking`이 높음
- 지역별 차이가 큼

**체크리스트:**
- [ ] CDN 설정 여부
- [ ] Keep-Alive 설정 확인
- [ ] 응답 압축 (gzip/brotli) 활성화 여부
- [ ] DNS 확인 시간

---

## 3. 시나리오별 분석 체크리스트

### 기본 부하 테스트 (api-jobs.js)

| 단계 | 확인 사항 |
|------|----------|
| Stage 1 (ramp-up) | 점진적 증가 시 응답 시간 변화 패턴 |
| Stage 2 (sustain) | 안정적인 응답 시간 유지 여부 |
| Stage 3 (ramp-down) | 부하 감소 후 정상 복귀 속도 |

**분석 포인트:**
- Stage 2에서 응답 시간이 계속 증가하면 → 메모리 누수 의심
- Stage 3에서 바로 복귀하지 않으면 → 커넥션 풀 소진 의심

### 검색 스트레스 테스트 (api-search.js)

| 확인 사항 | 양호 | 주의 | 위험 |
|----------|------|------|------|
| 검색 P95 | < 300ms | 300~500ms | > 500ms |
| 빈 결과 비율 | < 30% | 30~60% | > 60% |
| 에러율 | < 1% | 1~5% | > 5% |

### 스파이크 테스트 (concurrent-users.js)

| 확인 사항 | 양호 | 주의 | 위험 |
|----------|------|------|------|
| 스파이크 중 P95 | < 1000ms | 1~2s | > 2s |
| 서버 에러 | 0건 | 1~10건 | > 10건 |
| 타임아웃 | 0건 | 1~20건 | > 20건 |
| 복귀 시간 | < 30s | 30~60s | > 60s |

---

## 4. 결과 비교 방법

### JSON 결과 파일 비교

k6 테스트는 `results/` 폴더에 JSON 결과를 저장합니다:

```bash
# 최신 두 결과 비교
ls -la results/*.json

# jq로 핵심 메트릭 추출
jq '.metrics.http_req_duration.values | {avg, med, "p95": .["p(95)"], "p99": .["p(99)"], max}' results/api-jobs-*.json
```

### 성능 추이 추적

```bash
# 모든 결과에서 P95 추출
for f in results/api-jobs-*.json; do
  echo "$(basename $f): $(jq '.metrics.http_req_duration.values["p(95)"]' $f)ms"
done
```

---

## 5. 테스트 실행 가이드

```bash
# 기본 부하 테스트
npm run test:load

# 검색 스트레스 테스트
npm run test:load:search

# 스파이크 테스트
npm run test:load:spike

# 커스텀 URL로 테스트 (프로덕션)
k6 run -e BASE_URL=https://your-app.vercel.app tests/load/api-jobs.js

# 결과를 JSON으로 저장
k6 run --out json=results/output.json tests/load/api-jobs.js

# HTML 리포트 생성
node tests/load/report-generator.js results/api-jobs-*.json
```
