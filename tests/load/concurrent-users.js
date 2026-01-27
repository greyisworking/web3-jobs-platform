/**
 * k6 스파이크 테스트 - 급격한 동시 사용자 증가
 *
 * 갑작스러운 트래픽 증가 시 시스템 안정성 검증
 * 예: 뉴스 보도, 소셜 미디어 바이럴 등으로 인한 트래픽 급증
 *
 * 실행:
 *   k6 run tests/load/concurrent-users.js
 *   k6 run --out json=results/spike-test.json tests/load/concurrent-users.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// --- 커스텀 메트릭 ---
const spikeErrorRate = new Rate('spike_error_rate')
const spikeLatency = new Trend('spike_latency')
const timeouts = new Counter('request_timeouts')  // 타임아웃 카운터
const serverErrors = new Counter('server_errors')  // 5xx 에러 카운터

export const options = {
  // 스파이크 시나리오: 갑작스러운 100 VU 진입
  scenarios: {
    // 시나리오 1: 정상 트래픽 (기본 부하)
    normal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 }, // 정상 트래픽
        { duration: '4m', target: 10 },  // 유지
        { duration: '30s', target: 0 },  // 종료
      ],
      tags: { scenario: 'normal' },
    },

    // 시나리오 2: 스파이크 (급격한 트래픽 증가)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 0 },   // 대기 (정상 트래픽 먼저 시작)
        { duration: '10s', target: 100 },  // 10초 만에 100 VU 스파이크!
        { duration: '1m', target: 100 },   // 100 VU 유지
        { duration: '10s', target: 0 },    // 급격히 감소
        { duration: '2m', target: 0 },     // 회복 관찰
      ],
      tags: { scenario: 'spike' },
    },
  },

  thresholds: {
    // 스파이크 중에도 유지해야 할 성능 기준
    http_req_duration: [
      'p(95)<1000',  // 스파이크 시 P95 < 1000ms (완화된 기준)
      'p(99)<2000',  // 스파이크 시 P99 < 2000ms
    ],
    http_req_failed: ['rate<0.05'],     // 스파이크 시 실패율 < 5%
    spike_error_rate: ['rate<0.05'],
    request_timeouts: ['count<50'],     // 타임아웃 50회 미만
    server_errors: ['count<20'],        // 서버 에러 20회 미만
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// --- 요청 패턴 (실제 사용자 행동) ---
const endpoints = [
  { path: '/api/jobs', weight: 40 },                       // 40%: 기본 목록
  { path: '/api/jobs?status=active', weight: 20 },         // 20%: 활성 job
  { path: '/api/jobs?search=web3', weight: 15 },           // 15%: 검색
  { path: '/api/jobs?region=Global', weight: 10 },         // 10%: 글로벌 필터
  { path: '/api/jobs?region=Korea', weight: 5 },           //  5%: 한국 필터
  { path: '/api/jobs?status=all', weight: 5 },             //  5%: 전체 조회
  { path: '/api/jobs?search=solidity&region=Global', weight: 5 }, // 5%: 복합 필터
]

// 가중치 기반 랜덤 선택
function selectEndpoint() {
  const total = endpoints.reduce((sum, e) => sum + e.weight, 0)
  let random = Math.random() * total
  for (const endpoint of endpoints) {
    random -= endpoint.weight
    if (random <= 0) return endpoint.path
  }
  return endpoints[0].path
}

// --- 메인 테스트 ---
export default function () {
  const path = selectEndpoint()

  group('스파이크 테스트', () => {
    const res = http.get(`${BASE_URL}${path}`, {
      headers: { 'Accept': 'application/json' },
      tags: { endpoint: path },
      timeout: '10s', // 타임아웃 10초
    })

    spikeLatency.add(res.timings.duration)

    // 타임아웃 체크
    if (res.timings.duration >= 10000) {
      timeouts.add(1)
    }

    // 서버 에러 체크
    if (res.status >= 500) {
      serverErrors.add(1)
    }

    const success = check(res, {
      '상태코드 200': (r) => r.status === 200,
      '응답 본문 존재': (r) => r.body && r.body.length > 0,
      '유효한 JSON': (r) => {
        try {
          JSON.parse(r.body)
          return true
        } catch {
          return false
        }
      },
      '응답 시간 < 2000ms': (r) => r.timings.duration < 2000,
    })

    spikeErrorRate.add(!success)
  })

  // 스파이크 중에는 대기 시간 짧게 (실제 급증 패턴)
  sleep(Math.random() * 0.5 + 0.1)
}

// --- 결과 요약 ---
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    stdout: textSummary(data),
    [`results/spike-test-${now}.json`]: JSON.stringify(data, null, 2),
  }
}

function textSummary(data) {
  const metrics = data.metrics
  const lines = [
    '\n========================================',
    '  k6 스파이크 테스트 결과',
    '  (동시 사용자 100명 급증)',
    '========================================\n',
  ]

  if (metrics.spike_latency) {
    const d = metrics.spike_latency.values
    lines.push(`  응답 시간 (ms):`)
    lines.push(`    평균: ${d.avg?.toFixed(2) || 'N/A'}`)
    lines.push(`    P50:  ${d.med?.toFixed(2) || 'N/A'}`)
    lines.push(`    P90:  ${d['p(90)']?.toFixed(2) || 'N/A'}`)
    lines.push(`    P95:  ${d['p(95)']?.toFixed(2) || 'N/A'}`)
    lines.push(`    P99:  ${d['p(99)']?.toFixed(2) || 'N/A'}`)
    lines.push(`    최대: ${d.max?.toFixed(2) || 'N/A'}`)
  }

  if (metrics.http_reqs) {
    lines.push(`\n  총 요청 수: ${metrics.http_reqs.values.count}`)
    lines.push(`  초당 요청: ${metrics.http_reqs.values.rate?.toFixed(2)}/s`)
  }

  if (metrics.request_timeouts) {
    lines.push(`\n  타임아웃: ${metrics.request_timeouts.values.count}회`)
  }
  if (metrics.server_errors) {
    lines.push(`  서버 에러 (5xx): ${metrics.server_errors.values.count}회`)
  }
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2)
    lines.push(`  전체 실패율: ${failRate}%`)
  }

  // 통과/실패 판정
  const passed = data.root_group?.checks?.every((c) => c.fails === 0) ?? true
  lines.push(`\n  결과: ${passed ? 'PASS' : 'FAIL'}`)
  lines.push('\n========================================\n')
  return lines.join('\n')
}
