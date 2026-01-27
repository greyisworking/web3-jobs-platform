/**
 * k6 부하 테스트 - 검색 엔드포인트 스트레스 테스트
 *
 * 검색 기능에 대한 집중적인 부하 테스트
 * 다양한 검색어와 필터 조합으로 API 성능 측정
 *
 * 실행:
 *   k6 run tests/load/api-search.js
 *   k6 run --out json=results/api-search.json tests/load/api-search.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// --- 커스텀 메트릭 ---
const searchErrorRate = new Rate('search_error_rate')
const searchLatency = new Trend('search_latency')
const emptyResults = new Counter('empty_search_results') // 빈 결과 카운터

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 워밍업
    { duration: '2m', target: 40 },   // 검색 부하 증가
    { duration: '1m', target: 60 },   // 피크 부하
    { duration: '30s', target: 0 },   // 쿨다운
  ],

  thresholds: {
    http_req_duration: [
      'p(95)<500',  // 검색 P95 < 500ms
      'p(99)<1000', // 검색 P99 < 1000ms
    ],
    http_req_failed: ['rate<0.01'],
    search_error_rate: ['rate<0.01'],
    search_latency: ['p(95)<500'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// --- 검색어 목록 (실제 사용 패턴 시뮬레이션) ---
const searchTerms = [
  // 기술 스택 검색
  'solidity', 'rust', 'typescript', 'react', 'node.js',
  'python', 'go', 'smart contract', 'defi', 'nft',
  // 직무 검색
  'developer', 'engineer', 'designer', 'manager', 'analyst',
  'frontend', 'backend', 'fullstack', 'devops', 'security',
  // 블록체인 플랫폼
  'ethereum', 'solana', 'sui', 'polygon', 'bitcoin',
  'web3', 'blockchain', 'crypto', 'layer 2', 'bridge',
  // 한국어 검색
  '블록체인', '개발자', '프론트엔드', '백엔드', '서울',
]

// --- 필터 조합 ---
const filters = [
  '',
  '&region=Global',
  '&region=Korea',
  '&status=active',
  '&status=all',
  '&region=Global&status=active',
  '&region=Korea&status=active',
]

// --- 메인 테스트 ---
export default function () {
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)]
  const filter = filters[Math.floor(Math.random() * filters.length)]
  const encodedTerm = encodeURIComponent(term)

  group('검색 테스트', () => {
    // 검색 쿼리 실행
    const url = `${BASE_URL}/api/jobs?search=${encodedTerm}${filter}`
    const res = http.get(url, {
      headers: { 'Accept': 'application/json' },
      tags: { endpoint: 'search', term: term },
    })

    searchLatency.add(res.timings.duration)

    const success = check(res, {
      '상태코드 200': (r) => r.status === 200,
      '유효한 JSON 응답': (r) => {
        try {
          JSON.parse(r.body)
          return true
        } catch {
          return false
        }
      },
      'jobs 배열 반환': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body).jobs)
        } catch {
          return false
        }
      },
      '응답 시간 < 500ms': (r) => r.timings.duration < 500,
    })

    searchErrorRate.add(!success)

    // 빈 결과 추적
    try {
      const body = JSON.parse(res.body)
      if (body.jobs && body.jobs.length === 0) {
        emptyResults.add(1)
      }
    } catch {
      // 무시
    }
  })

  // 연속 검색 시뮬레이션 (사용자가 검색어를 수정하는 패턴)
  group('연속 검색 시뮬레이션', () => {
    // 첫 번째 검색
    const firstTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
    http.get(`${BASE_URL}/api/jobs?search=${encodeURIComponent(firstTerm)}`, {
      tags: { endpoint: 'search', type: 'sequential-1' },
    })

    sleep(0.5) // 타이핑 시뮬레이션

    // 검색어 수정 (더 구체적으로)
    const refinedTerm = `${firstTerm} developer`
    http.get(`${BASE_URL}/api/jobs?search=${encodeURIComponent(refinedTerm)}`, {
      tags: { endpoint: 'search', type: 'sequential-2' },
    })
  })

  sleep(Math.random() * 1.5 + 0.5)
}

// --- 결과 요약 ---
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    stdout: textSummary(data),
    [`results/api-search-${now}.json`]: JSON.stringify(data, null, 2),
  }
}

function textSummary(data) {
  const metrics = data.metrics
  const lines = [
    '\n========================================',
    '  k6 검색 스트레스 테스트 결과',
    '========================================\n',
  ]

  if (metrics.search_latency) {
    const d = metrics.search_latency.values
    lines.push(`  검색 응답 시간 (ms):`)
    lines.push(`    평균: ${d.avg?.toFixed(2) || 'N/A'}`)
    lines.push(`    P95:  ${d['p(95)']?.toFixed(2) || 'N/A'}`)
    lines.push(`    P99:  ${d['p(99)']?.toFixed(2) || 'N/A'}`)
  }

  if (metrics.http_reqs) {
    lines.push(`\n  총 요청 수: ${metrics.http_reqs.values.count}`)
    lines.push(`  초당 요청: ${metrics.http_reqs.values.rate?.toFixed(2)}/s`)
  }

  if (metrics.empty_search_results) {
    lines.push(`\n  빈 검색 결과: ${metrics.empty_search_results.values.count}회`)
  }

  lines.push('\n========================================\n')
  return lines.join('\n')
}
