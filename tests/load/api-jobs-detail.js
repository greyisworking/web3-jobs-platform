/**
 * k6 부하 테스트 - 개별 Job 조회 테스트
 *
 * 특정 job의 상세 정보를 조회하는 패턴 테스트
 * 목록 → 상세 → 목록 순서로 실제 사용자 행동 시뮬레이션
 *
 * 실행:
 *   k6 run tests/load/api-jobs-detail.js
 *   k6 run --out json=results/api-jobs-detail.json tests/load/api-jobs-detail.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// --- 커스텀 메트릭 ---
const listLatency = new Trend('list_latency')   // 목록 조회 응답 시간
const detailLatency = new Trend('detail_latency') // 상세 조회 응답 시간
const detailErrorRate = new Rate('detail_error_rate')

export const options = {
  stages: [
    { duration: '30s', target: 15 }, // 워밍업
    { duration: '2m', target: 30 },  // 일반 부하
    { duration: '1m', target: 30 },  // 유지
    { duration: '30s', target: 0 },  // 쿨다운
  ],

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    list_latency: ['p(95)<500'],
    detail_latency: ['p(95)<300'], // 상세 조회는 더 빨라야 함
    detail_error_rate: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// --- 사용자 여정 시뮬레이션 ---
export default function () {
  let jobIds = []

  // 1단계: 목록 조회 (사용자가 페이지 진입)
  group('1. Job 목록 조회', () => {
    const res = http.get(`${BASE_URL}/api/jobs`, {
      headers: { 'Accept': 'application/json' },
      tags: { endpoint: 'list' },
    })

    listLatency.add(res.timings.duration)

    const success = check(res, {
      '목록 상태코드 200': (r) => r.status === 200,
      '목록 JSON 유효': (r) => {
        try {
          JSON.parse(r.body)
          return true
        } catch {
          return false
        }
      },
    })

    // job ID 수집 (상세 조회에 사용)
    try {
      const body = JSON.parse(res.body)
      if (body.jobs && body.jobs.length > 0) {
        jobIds = body.jobs.slice(0, 10).map((j) => j.id).filter(Boolean)
      }
    } catch {
      // 무시
    }
  })

  sleep(1) // 사용자가 목록을 둘러보는 시간

  // 2단계: 상세 조회 (사용자가 job 클릭)
  group('2. Job 상세 조회', () => {
    if (jobIds.length === 0) {
      // job이 없으면 목록 재조회로 대체
      const res = http.get(`${BASE_URL}/api/jobs?status=all`, {
        tags: { endpoint: 'detail-fallback' },
      })
      detailLatency.add(res.timings.duration)
      detailErrorRate.add(res.status !== 200)
      return
    }

    // 랜덤 job 선택
    const jobId = jobIds[Math.floor(Math.random() * jobIds.length)]
    const res = http.get(`${BASE_URL}/api/jobs/${jobId}`, {
      headers: { 'Accept': 'application/json' },
      tags: { endpoint: 'detail', jobId: String(jobId) },
    })

    detailLatency.add(res.timings.duration)

    const success = check(res, {
      '상세 상태코드 200 또는 404': (r) => r.status === 200 || r.status === 404,
      '상세 응답 시간 < 300ms': (r) => r.timings.duration < 300,
    })

    detailErrorRate.add(!success)
  })

  sleep(2) // 사용자가 상세 페이지를 읽는 시간

  // 3단계: 다른 필터로 목록 재조회 (사용자가 필터 변경)
  group('3. 필터 변경 후 재조회', () => {
    const filterOptions = [
      '?region=Global',
      '?region=Korea',
      '?status=active',
      '?search=blockchain',
    ]
    const filter = filterOptions[Math.floor(Math.random() * filterOptions.length)]

    const res = http.get(`${BASE_URL}/api/jobs${filter}`, {
      headers: { 'Accept': 'application/json' },
      tags: { endpoint: 'list-filtered' },
    })

    listLatency.add(res.timings.duration)

    check(res, {
      '필터 목록 상태코드 200': (r) => r.status === 200,
    })
  })

  sleep(Math.random() * 2 + 1)
}

// --- 결과 요약 ---
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    stdout: textSummary(data),
    [`results/api-jobs-detail-${now}.json`]: JSON.stringify(data, null, 2),
  }
}

function textSummary(data) {
  const metrics = data.metrics
  const lines = [
    '\n========================================',
    '  k6 Job 상세 조회 테스트 결과',
    '========================================\n',
  ]

  if (metrics.list_latency) {
    const d = metrics.list_latency.values
    lines.push(`  목록 응답 시간 (ms):`)
    lines.push(`    평균: ${d.avg?.toFixed(2) || 'N/A'}  P95: ${d['p(95)']?.toFixed(2) || 'N/A'}`)
  }

  if (metrics.detail_latency) {
    const d = metrics.detail_latency.values
    lines.push(`  상세 응답 시간 (ms):`)
    lines.push(`    평균: ${d.avg?.toFixed(2) || 'N/A'}  P95: ${d['p(95)']?.toFixed(2) || 'N/A'}`)
  }

  if (metrics.http_reqs) {
    lines.push(`\n  총 요청 수: ${metrics.http_reqs.values.count}`)
  }

  lines.push('\n========================================\n')
  return lines.join('\n')
}
