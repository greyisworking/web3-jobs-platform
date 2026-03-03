'use client'

import { useState } from 'react'
import {
  FileText,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  TrendingUp,
  Briefcase,
  Globe,
  Flame,
  Eye,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/admin/stat-card'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'

interface HotSkill {
  name: string
  count: number
  prevCount: number
  change: number
}

interface ChainTrend {
  name: string
  count: number
  prevCount: number
  change: number
}

interface ReportData {
  period: { start: string; end: string }
  summary: {
    totalJobs: number
    newJobs: number
    prevTotalJobs: number
    changeRate: number
  }
  hotSkills: HotSkill[]
  newCompanies: string[]
  chainTrends: ChainTrend[]
  remoteTrend: { current: number; previous: number }
  aiSummary?: string
}

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

function changeSymbol(change: number): string {
  if (change > 0) return `▲ +${change}%`
  if (change < 0) return `▼ ${change}%`
  return '→ 0%'
}

export default function ReportPage() {
  const [periodType, setPeriodType] = useState<'this' | 'last' | 'custom'>('this')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [includeAI, setIncludeAI] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [previewMode, setPreviewMode] = useState<'preview' | 'edit'>('preview')
  const [copied, setCopied] = useState(false)

  const getDateRange = () => {
    if (periodType === 'this') return getMonthRange(0)
    if (periodType === 'last') return getMonthRange(-1)
    return { start: customStart, end: customEnd }
  }

  const generateReport = async () => {
    const { start, end } = getDateRange()
    if (!start || !end) {
      alert('기간을 선택해 주세요.')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/admin/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, includeAI }),
      })
      const data = await res.json()
      if (data.error) {
        alert('리포트 생성 실패: ' + data.error)
        return
      }
      setReport(data.report)
      setMarkdown(data.markdown)
      setPreviewMode('preview')
    } catch (error) {
      console.error('Report generation failed:', error)
      alert('리포트 생성 중 오류가 발생했어요.')
    } finally {
      setGenerating(false)
    }
  }

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-500" />
          월간 Market Report
        </h1>
        <p className="text-gray-400 mt-1">월간 시장 동향 리포트를 생성하고 공유하세요</p>
      </div>

      {/* Period Selection + Options */}
      <div className="bg-[#1e293b] rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">기간:</span>
          </div>
          <div className="flex gap-2">
            {([
              { key: 'this', label: '이번 달' },
              { key: 'last', label: '지난 달' },
              { key: 'custom', label: '커스텀' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setPeriodType(opt.key)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  periodType === opt.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0f172a] text-gray-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date inputs */}
        {periodType === 'custom' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">시작일:</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-[#0f172a] border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">종료일:</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-[#0f172a] border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={includeAI}
              onChange={e => setIncludeAI(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-[#0f172a]"
            />
            AI 트렌드 요약 포함
          </label>

          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {generating ? '생성 중...' : '리포트 생성'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="전체 공고"
            value={`${report.summary.totalJobs}건`}
            description={`전월 대비 ${changeSymbol(report.summary.changeRate)}`}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <StatCard
            title="전월 공고"
            value={`${report.summary.prevTotalJobs}건`}
            description="비교 기간"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="리모트 비율"
            value={`${report.remoteTrend.current}%`}
            description={`전월: ${report.remoteTrend.previous}%`}
            icon={<Globe className="h-4 w-4" />}
          />
          <StatCard
            title="Top Skill"
            value={report.hotSkills[0]?.name || '-'}
            description={report.hotSkills[0] ? `${report.hotSkills[0].count}건` : ''}
            icon={<Flame className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Markdown Report */}
      {markdown && (
        <Card className="bg-[#1e293b] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-700">
            <CardTitle className="text-white text-base">마크다운 리포트</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('preview')}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                  previewMode === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0f172a] text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                미리보기
              </button>
              <button
                onClick={() => setPreviewMode('edit')}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                  previewMode === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0f172a] text-gray-400 hover:text-white'
                }`}
              >
                <Pencil className="w-3 h-3" />
                편집
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {previewMode === 'preview' ? (
              <div className="p-4 max-h-[600px] overflow-auto">
                <MarkdownRenderer content={markdown} />
              </div>
            ) : (
              <textarea
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
                className="w-full h-[600px] p-4 bg-[#0f172a] text-gray-300 font-mono text-sm resize-none focus:outline-none rounded-b-lg"
              />
            )}
          </CardContent>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={copyMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white rounded hover:bg-[#0f172a]/80 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? '복사 완료!' : '마크다운 복사'}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
