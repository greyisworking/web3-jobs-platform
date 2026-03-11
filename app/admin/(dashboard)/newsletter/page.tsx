'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Copy,
  Check,
  Save,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  ChevronDown,
  FileText,
  Code,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  url: string
  role: string | null
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  is_featured: boolean | null
  backers?: string[] | null
  wasInPreviousNewsletter?: boolean
}

interface VerifiedJob extends Job {
  verificationStatus?: 'verified' | 'warning' | 'failed'
  verificationMessage?: string
}

interface Stats {
  totalJobs: number
  roleBreakdown: Record<string, number>
  remoteRate: number
  topCompanies: { name: string; count: number }[]
}

interface VerificationResult {
  total: number
  verified: number
  warnings: number
  failed: number
  jobs: VerifiedJob[]
}

const PERIOD_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
]

export default function NewsletterPage() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [period, setPeriod] = useState(7)
  const [jobs, setJobs] = useState<VerifiedJob[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Stats | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [html, setHtml] = useState('')
  const [customIntro, setCustomIntro] = useState('')
  const [copied, setCopied] = useState<'md' | 'html' | null>(null)
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')
  const [showHtml, setShowHtml] = useState(false)
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [skipVerification, setSkipVerification] = useState(false)

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/newsletter?days=${period}&limit=200`)
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
        const initialSelected = new Set<string>(
          data.jobs
            .filter((j: Job) => !j.wasInPreviousNewsletter)
            .map((j: Job) => j.id)
        )
        setSelectedIds(initialSelected)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Generate newsletter
  const generateNewsletter = async () => {
    const selectedJobs = jobs.filter(j => selectedIds.has(j.id))
    if (selectedJobs.length === 0) {
      alert('공고를 하나 이상 선택해 주세요.')
      return
    }

    setGenerating(true)
    setVerification(null)
    try {
      const res = await fetch('/api/admin/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: selectedJobs,
          stats: calculateSelectedStats(selectedJobs),
          customIntro: customIntro || undefined,
          skipVerification,
        }),
      })
      const data = await res.json()
      if (data.markdown) {
        setMarkdown(data.markdown)
        setHtml(data.html)
        if (data.verification) {
          setVerification(data.verification)
          // Update jobs with verification status
          const verifiedMap = new Map<string, VerifiedJob>(
            data.verification.jobs.map((j: VerifiedJob) => [j.id, j])
          )
          setJobs(prev => prev.map(j => {
            const verified = verifiedMap.get(j.id)
            return {
              ...j,
              verificationStatus: verified?.verificationStatus,
              verificationMessage: verified?.verificationMessage,
            }
          }))
        }
      }
    } catch (error) {
      console.error('Failed to generate newsletter:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Calculate stats for selected jobs
  const calculateSelectedStats = (selectedJobs: Job[]): Stats => {
    const roleBreakdown: Record<string, number> = {}
    const companyCount: Record<string, number> = {}
    let remoteCount = 0

    for (const job of selectedJobs) {
      const role = job.role || 'Other'
      roleBreakdown[role] = (roleBreakdown[role] || 0) + 1

      if (job.location?.toLowerCase().includes('remote')) {
        remoteCount++
      }

      companyCount[job.company] = (companyCount[job.company] || 0) + 1
    }

    const topCompanies = Object.entries(companyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return {
      totalJobs: selectedJobs.length,
      roleBreakdown,
      remoteRate: selectedJobs.length > 0 ? Math.round((remoteCount / selectedJobs.length) * 100) : 0,
      topCompanies,
    }
  }

  // Save newsletter
  const saveNewsletter = async () => {
    if (!markdown) {
      alert('먼저 뉴스레터를 생성해 주세요.')
      return
    }

    setSaving(true)
    try {
      const today = new Date()
      const month = today.getMonth() + 1
      const weekNum = Math.ceil(today.getDate() / 7)
      const title = `NEUN 위클리 | ${month}월 ${weekNum}주차`

      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contentMd: markdown,
          contentHtml: html,
          jobIds: Array.from(selectedIds),
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('뉴스레터가 저장되었어요!')
      } else {
        alert('저장 실패: ' + (data.error || '알 수 없는 오류'))
      }
    } catch (error) {
      console.error('Failed to save newsletter:', error)
      alert('뉴스레터 저장 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (type: 'md' | 'html') => {
    const content = type === 'md' ? markdown : html
    await navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  // Toggle job selection
  const toggleJob = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select/deselect all
  const toggleAll = () => {
    if (selectedIds.size === jobs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(jobs.map(j => j.id)))
    }
  }

  const getVerificationIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Check className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-green-500" />
            NEUN 주간 뉴스레터 생성기
          </h1>
          <p className="text-gray-400 mt-1">뉴스레터 콘텐츠를 만들고 관리해요</p>
        </div>
      </div>

      {/* Period Selection + Generate Button */}
      <div className="bg-[#1e293b] rounded-lg p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">기간:</span>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  period === opt.value
                    ? 'bg-green-600 text-white'
                    : 'bg-[#0f172a] text-gray-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={skipVerification}
            onChange={e => setSkipVerification(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-[#0f172a]"
          />
          검증 건너뛰기
        </label>

        <div className="flex-1" />

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-gray-300 rounded hover:bg-[#0f172a]/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>

        <button
          onClick={generateNewsletter}
          disabled={generating || selectedIds.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          미리보기 생성
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              전체 공고
            </div>
            <div className="text-2xl font-bold text-white">{jobs.length}</div>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Check className="w-4 h-4" />
              선택됨
            </div>
            <div className="text-2xl font-bold text-green-500">{selectedIds.size}</div>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              리모트 비율
            </div>
            <div className="text-2xl font-bold text-white">{stats.remoteRate}%</div>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ChevronDown className="w-4 h-4" />
              인기 직무
            </div>
            <div className="text-xl font-bold text-white truncate">
              {Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Verification Results */}
      {verification && (
        <div className="bg-[#1e293b] rounded-lg p-4">
          <h3 className="font-medium text-white flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-green-500" />
            검증 결과
          </h3>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2 text-green-500">
              <Check className="w-4 h-4" />
              확인됨: {verification.verified}
            </span>
            <span className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-4 h-4" />
              경고: {verification.warnings}
            </span>
            <span className="flex items-center gap-2 text-red-500">
              <XCircle className="w-4 h-4" />
              실패: {verification.failed}
            </span>
          </div>
        </div>
      )}

      {/* Custom Intro */}
      <div className="bg-[#1e293b] rounded-lg p-4">
        <label className="text-sm text-gray-400 mb-2 block">인트로 문구 (선택)</label>
        <input
          type="text"
          value={customIntro}
          onChange={e => setCustomIntro(e.target.value)}
          placeholder="gm ser, this week's Web3 job market is heating up 🔥"
          className="w-full bg-[#0f172a] border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Job Selection */}
      <div className="bg-[#1e293b] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="font-medium text-white">공고 선택</h3>
          <button
            onClick={toggleAll}
            className="text-sm text-green-500 hover:text-green-400"
          >
            {selectedIds.size === jobs.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">불러오는 중...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">해당 기간에 공고가 없어요</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#0f172a] sticky top-0">
                <tr>
                  <th className="w-10 p-3"></th>
                  <th className="text-left p-3 text-xs text-gray-400 uppercase">회사</th>
                  <th className="text-left p-3 text-xs text-gray-400 uppercase">포지션</th>
                  <th className="text-left p-3 text-xs text-gray-400 uppercase">직무</th>
                  <th className="text-left p-3 text-xs text-gray-400 uppercase">위치</th>
                  <th className="text-left p-3 text-xs text-gray-400 uppercase">상태</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr
                    key={job.id}
                    className={`border-b border-gray-700/50 hover:bg-[#0f172a]/50 cursor-pointer ${
                      job.wasInPreviousNewsletter ? 'opacity-50' : ''
                    } ${job.verificationStatus === 'failed' ? 'bg-red-900/20' : ''}`}
                    onClick={() => toggleJob(job.id)}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(job.id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-[#0f172a]"
                      />
                    </td>
                    <td className="p-3 text-white font-medium">{job.company}</td>
                    <td className="p-3 text-gray-300">{job.title}</td>
                    <td className="p-3 text-gray-400 text-sm">{job.role || '-'}</td>
                    <td className="p-3 text-gray-400 text-sm">{job.location || 'Remote'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getVerificationIcon(job.verificationStatus)}
                        {job.is_featured && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded">추천</span>
                        )}
                        {job.wasInPreviousNewsletter && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">발송됨</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Preview/Editor */}
      {markdown && (
        <div className="bg-[#1e293b] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-medium text-white">미리보기</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHtml(false)}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                    !showHtml ? 'bg-green-600 text-white' : 'bg-[#0f172a] text-gray-400'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Markdown
                </button>
                <button
                  onClick={() => setShowHtml(true)}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                    showHtml ? 'bg-green-600 text-white' : 'bg-[#0f172a] text-gray-400'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  HTML
                </button>
              </div>
              <button
                onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-[#0f172a] text-gray-400 hover:text-white"
              >
                {previewMode === 'edit' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {previewMode === 'edit' ? '미리보기' : '편집'}
              </button>
            </div>
          </div>

          {previewMode === 'edit' ? (
            <textarea
              value={showHtml ? html : markdown}
              onChange={e => showHtml ? setHtml(e.target.value) : setMarkdown(e.target.value)}
              className="w-full h-96 p-4 bg-[#0f172a] text-gray-300 font-mono text-sm resize-none focus:outline-none"
            />
          ) : (
            <div className="h-96 overflow-auto">
              {showHtml ? (
                <iframe
                  srcDoc={html}
                  className="w-full h-full border-0"
                  title="Newsletter Preview"
                />
              ) : (
                <div className="p-4 prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm">{markdown}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {markdown && (
        <div className="flex gap-4">
          <button
            onClick={() => copyToClipboard('md')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white rounded hover:bg-[#1e293b]/80 transition-colors"
          >
            {copied === 'md' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            마크다운 복사 (루디움)
          </button>
          <button
            onClick={() => copyToClipboard('html')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white rounded hover:bg-[#1e293b]/80 transition-colors"
          >
            {copied === 'html' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            HTML 복사 (스티비)
          </button>
          <div className="flex-1" />
          <button
            onClick={saveNewsletter}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장 (아카이브)
          </button>
        </div>
      )}
    </div>
  )
}
