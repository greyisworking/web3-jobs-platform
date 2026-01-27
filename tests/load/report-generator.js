#!/usr/bin/env node

/**
 * k6 결과 HTML 리포트 생성기
 *
 * 사용법:
 *   node tests/load/report-generator.js results/api-jobs-*.json
 *   node tests/load/report-generator.js results/spike-test-*.json --output report.html
 *
 * 출력:
 *   results/report-{timestamp}.html
 */

const fs = require('fs')
const path = require('path')

// --- 인자 파싱 ---
const args = process.argv.slice(2)
let outputPath = null
const inputFiles = []

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputPath = args[++i]
  } else {
    inputFiles.push(args[i])
  }
}

if (inputFiles.length === 0) {
  console.error('사용법: node report-generator.js <result-file.json> [--output report.html]')
  console.error('예시: node tests/load/report-generator.js results/api-jobs-*.json')
  process.exit(1)
}

// --- 결과 파일 로드 ---
const results = []
for (const file of inputFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
    results.push({ file: path.basename(file), data })
    console.log(`✅ 로드됨: ${file}`)
  } catch (err) {
    console.error(`❌ 파일 로드 실패: ${file} - ${err.message}`)
  }
}

if (results.length === 0) {
  console.error('유효한 결과 파일이 없습니다.')
  process.exit(1)
}

// --- 메트릭 추출 ---
function extractMetrics(data) {
  const m = data.metrics || {}
  return {
    duration: {
      avg: m.http_req_duration?.values?.avg,
      med: m.http_req_duration?.values?.med,
      p90: m.http_req_duration?.values?.['p(90)'],
      p95: m.http_req_duration?.values?.['p(95)'],
      p99: m.http_req_duration?.values?.['p(99)'],
      max: m.http_req_duration?.values?.max,
      min: m.http_req_duration?.values?.min,
    },
    requests: {
      total: m.http_reqs?.values?.count,
      rate: m.http_reqs?.values?.rate,
    },
    failures: {
      rate: m.http_req_failed?.values?.rate,
      count: m.http_req_failed?.values?.passes != null
        ? m.http_reqs?.values?.count - m.http_req_failed?.values?.passes
        : null,
    },
    waiting: {
      avg: m.http_req_waiting?.values?.avg,
      p95: m.http_req_waiting?.values?.['p(95)'],
    },
    connecting: {
      avg: m.http_req_connecting?.values?.avg,
    },
    vus: {
      max: m.vus_max?.values?.max || m.vus?.values?.max,
    },
  }
}

// --- 상태 판정 ---
function getStatus(value, good, warn) {
  if (value == null) return { class: 'neutral', label: 'N/A' }
  if (value <= good) return { class: 'good', label: '양호' }
  if (value <= warn) return { class: 'warn', label: '주의' }
  return { class: 'bad', label: '위험' }
}

function fmt(value, decimals = 2) {
  if (value == null || isNaN(value)) return 'N/A'
  return Number(value).toFixed(decimals)
}

function pct(value) {
  if (value == null || isNaN(value)) return 'N/A'
  return (value * 100).toFixed(2) + '%'
}

// --- HTML 생성 ---
function generateHTML(results) {
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })

  const reportSections = results.map(({ file, data }) => {
    const m = extractMetrics(data)
    const p95Status = getStatus(m.duration.p95, 500, 1000)
    const p99Status = getStatus(m.duration.p99, 1000, 2000)
    const failStatus = getStatus(m.failures.rate, 0.01, 0.05)

    // 통과/실패 판정
    const thresholdsPassed = (m.duration.p95 || 0) < 500
      && (m.duration.p99 || 0) < 1000
      && (m.failures.rate || 0) < 0.01

    return `
    <div class="report-card">
      <div class="card-header">
        <h2>${file}</h2>
        <span class="badge ${thresholdsPassed ? 'badge-pass' : 'badge-fail'}">
          ${thresholdsPassed ? 'PASS' : 'FAIL'}
        </span>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <h3>응답 시간 (ms)</h3>
          <table>
            <tr><td>평균</td><td>${fmt(m.duration.avg)}</td><td></td></tr>
            <tr><td>중앙값 (P50)</td><td>${fmt(m.duration.med)}</td><td></td></tr>
            <tr><td>P90</td><td>${fmt(m.duration.p90)}</td><td></td></tr>
            <tr>
              <td>P95</td>
              <td class="${p95Status.class}">${fmt(m.duration.p95)}</td>
              <td><span class="status-badge ${p95Status.class}">${p95Status.label}</span></td>
            </tr>
            <tr>
              <td>P99</td>
              <td class="${p99Status.class}">${fmt(m.duration.p99)}</td>
              <td><span class="status-badge ${p99Status.class}">${p99Status.label}</span></td>
            </tr>
            <tr><td>최대</td><td>${fmt(m.duration.max)}</td><td></td></tr>
            <tr><td>최소</td><td>${fmt(m.duration.min)}</td><td></td></tr>
          </table>
        </div>

        <div class="metric-card">
          <h3>요청 통계</h3>
          <table>
            <tr><td>총 요청 수</td><td>${m.requests.total ?? 'N/A'}</td></tr>
            <tr><td>초당 요청 (RPS)</td><td>${fmt(m.requests.rate)}</td></tr>
            <tr><td>최대 VU</td><td>${m.vus.max ?? 'N/A'}</td></tr>
            <tr>
              <td>실패율</td>
              <td class="${failStatus.class}">
                ${pct(m.failures.rate)}
                <span class="status-badge ${failStatus.class}">${failStatus.label}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="metric-card">
          <h3>네트워크</h3>
          <table>
            <tr><td>서버 대기 (TTFB) 평균</td><td>${fmt(m.waiting.avg)}ms</td></tr>
            <tr><td>서버 대기 (TTFB) P95</td><td>${fmt(m.waiting.p95)}ms</td></tr>
            <tr><td>연결 시간 평균</td><td>${fmt(m.connecting.avg)}ms</td></tr>
          </table>
        </div>
      </div>

      <div class="thresholds">
        <h3>성능 임계값</h3>
        <div class="threshold-list">
          <div class="threshold ${(m.duration.p95 || 0) < 500 ? 'pass' : 'fail'}">
            P95 &lt; 500ms: ${fmt(m.duration.p95)}ms
            ${(m.duration.p95 || 0) < 500 ? '&#10004;' : '&#10008;'}
          </div>
          <div class="threshold ${(m.duration.p99 || 0) < 1000 ? 'pass' : 'fail'}">
            P99 &lt; 1000ms: ${fmt(m.duration.p99)}ms
            ${(m.duration.p99 || 0) < 1000 ? '&#10004;' : '&#10008;'}
          </div>
          <div class="threshold ${(m.failures.rate || 0) < 0.01 ? 'pass' : 'fail'}">
            에러율 &lt; 1%: ${pct(m.failures.rate)}
            ${(m.failures.rate || 0) < 0.01 ? '&#10004;' : '&#10008;'}
          </div>
        </div>
      </div>
    </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 부하 테스트 리포트 - Web3 Jobs Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #334155;
    }
    .header h1 { color: #f8fafc; font-size: 1.8rem; margin-bottom: 0.5rem; }
    .header p { color: #94a3b8; font-size: 0.9rem; }
    .report-card {
      background: #1e293b;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid #334155;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #334155;
    }
    .card-header h2 { font-size: 1.2rem; color: #f8fafc; }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-pass { background: #065f46; color: #6ee7b7; }
    .badge-fail { background: #7f1d1d; color: #fca5a5; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #0f172a;
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid #334155;
    }
    .metric-card h3 {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table { width: 100%; border-collapse: collapse; }
    td {
      padding: 0.4rem 0.5rem;
      font-size: 0.9rem;
      border-bottom: 1px solid #1e293b;
    }
    td:first-child { color: #94a3b8; }
    td:nth-child(2) { text-align: right; font-variant-numeric: tabular-nums; }
    .good { color: #6ee7b7; }
    .warn { color: #fbbf24; }
    .bad { color: #fca5a5; }
    .neutral { color: #94a3b8; }
    .status-badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.5rem;
    }
    .status-badge.good { background: #065f46; }
    .status-badge.warn { background: #78350f; }
    .status-badge.bad { background: #7f1d1d; }
    .thresholds { margin-top: 1rem; }
    .thresholds h3 {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    .threshold-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .threshold {
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .threshold.pass { background: #065f46; color: #6ee7b7; }
    .threshold.fail { background: #7f1d1d; color: #fca5a5; }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #334155;
      color: #64748b;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>k6 Load Test Report</h1>
    <p>Web3 Jobs Platform | ${timestamp}</p>
    <p>${results.length}개 테스트 결과</p>
  </div>

  ${reportSections}

  <div class="footer">
    <p>Generated by report-generator.js | Web3 Jobs Platform</p>
    <p>Grafana 연동: k6 run --out influxdb=http://localhost:8086/k6 tests/load/api-jobs.js</p>
  </div>
</body>
</html>`
}

// --- 리포트 생성 ---
const html = generateHTML(results)

if (!outputPath) {
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const resultsDir = path.join(process.cwd(), 'results')
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }
  outputPath = path.join(resultsDir, `report-${now}.html`)
}

fs.writeFileSync(outputPath, html)
console.log(`\n📊 리포트 생성됨: ${outputPath}`)
