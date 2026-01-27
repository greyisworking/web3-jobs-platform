/**
 * k6 부하 테스트 - /api/jobs 엔드포인트
 *
 * 설치 방법:
 *   macOS:   brew install k6
 *   Windows: choco install k6
 *   Linux:   sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
 *            --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68 && \
 *            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
 *            sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6
 *   Docker:  docker run --rm -i grafana/k6 run - <api-jobs.js
 *
 * 실행 방법:
 *   k6 run tests/load/api-jobs.js
 *   k6 run --out json=results/api-jobs.json tests/load/api-jobs.js
 *
 * 환경변수:
 *   BASE_URL - 테스트 대상 URL (기본값: http://localhost:3000)
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// --- 커스텀 메트릭 정의 ---
const errorRate = new Rate('error_rate') // 에러 비율
const jobsReturned = new Trend('jobs_returned') // 반환된 job 수
const totalRequests = new Counter('total_requests') // 총 요청 수

// --- 테스트 설정 ---
export const options = {
  // 단계별 부하 시나리오
  stages: [
    { duration: '1m', target: 50 }, // Stage 1: 1분 동안 0→50 VU 증가
    { duration: '3m', target: 50 }, // Stage 2: 3분 동안 50 VU 유지
    { duration: '1m', target: 0 },  // Stage 3: 1분 동안 50→0 VU 감소
  ],

  // 성능 임계값 (실패 기준)
  thresholds: {
    http_req_duration: [
      'p(95)<500',  // P95 응답 시간 < 500ms
      'p(99)<1000', // P99 응답 시간 < 1000ms
    ],
    http_req_failed: ['rate<0.01'], // 실패율 < 1%
    error_rate: ['rate<0.01'],      // 커스텀 에러율 < 1%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// --- 쿼리 변형 목록 ---
const queryVariations = [
  '',                                    // 기본 (status=active)
  '?status=all',                         // 전체 조회
  '?status=active',                      // 활성 job만
  '?status=pending',                     // 대기 중
  '?search=blockchain',                  // 검색: blockchain
  '?search=solidity',                    // 검색: solidity
  '?search=react',                       // 검색: react
  '?region=Global',                      // 필터: 글로벌
  '?region=Korea',                       // 필터: 한국
  '?source=web3.career',                 // 필터: 소스별
  '?search=web3&region=Global',          // 검색 + 필터 조합
  '?search=developer&status=active',     // 검색 + 상태 조합
]

// --- 메인 테스트 함수 ---
export default function () {
  // 랜덤 쿼리 선택
  const query = queryVariations[Math.floor(Math.random() * queryVariations.length)]

  group('GET /api/jobs', () => {
    const url = `${BASE_URL}/api/jobs${query}`
    const params = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      tags: { endpoint: '/api/jobs', query: query || 'default' },
    }

    const res = http.get(url, params)
    totalRequests.add(1)

    // 응답 검증
    const success = check(res, {
      '상태코드 200': (r) => r.status === 200,
      '응답이 JSON': (r) => {
        try {
          JSON.parse(r.body)
          return true
        } catch {
          return false
        }
      },
      'jobs 배열 존재': (r) => {
        const body = JSON.parse(r.body)
        return Array.isArray(body.jobs)
      },
      'stats 객체 존재': (r) => {
        const body = JSON.parse(r.body)
        return body.stats !== undefined
      },
      '응답 시간 < 500ms': (r) => r.timings.duration < 500,
    })

    errorRate.add(!success)

    // 반환된 job 수 기록
    try {
      const body = JSON.parse(res.body)
      if (body.jobs) {
        jobsReturned.add(body.jobs.length)
      }
    } catch {
      // JSON 파싱 실패 무시
    }
  })

  // 사용자 행동 시뮬레이션: 요청 간 1~3초 대기
  sleep(Math.random() * 2 + 1)
}

// --- 테스트 결과 요약 ---
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    stdout: textSummary(data),
    [`results/api-jobs-${now}.json`]: JSON.stringify(data, null, 2),
  }
}

// 텍스트 요약 생성
function textSummary(data) {
  const metrics = data.metrics
  const lines = [
    '\n========================================',
    '  k6 부하 테스트 결과: /api/jobs',
    '========================================\n',
  ]

  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values
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

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2)
    lines.push(`\n  실패율: ${failRate}%`)
  }

  lines.push('\n========================================\n')
  return lines.join('\n')
}
