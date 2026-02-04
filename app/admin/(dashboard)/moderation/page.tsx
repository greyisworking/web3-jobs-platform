'use client'

import { useState, useEffect } from 'react'
import { Flag, Ban, Briefcase, Eye, EyeOff, Trash2, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Pixelbara from '@/app/components/Pixelbara'

interface JobReport {
  id: string
  jobId: string
  reporterWallet: string | null
  reporterIp: string | null
  reason: string
  createdAt: string
  job?: {
    id: string
    title: string
    company: string
    postedBy: string | null
    reportCount: number
    isHidden: boolean
  }
}

interface BlacklistedWallet {
  id: string
  wallet: string
  reason: string | null
  createdAt: string
  jobCount?: number
}

interface ManagedJob {
  id: string
  title: string
  company: string
  postedBy: string | null
  reportCount: number
  isHidden: boolean
  source: string
  createdAt: string
}

type TabType = 'jobs' | 'reports' | 'blacklist'

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs')
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<JobReport[]>([])
  const [blacklist, setBlacklist] = useState<BlacklistedWallet[]>([])
  const [jobs, setJobs] = useState<ManagedJob[]>([])
  const [newWallet, setNewWallet] = useState('')
  const [newReason, setNewReason] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'reports') {
        const res = await fetch('/api/admin/reports')
        const data = await res.json()
        setReports(data.reports || [])
      } else if (activeTab === 'blacklist') {
        const res = await fetch('/api/admin/blacklist')
        const data = await res.json()
        setBlacklist(data.blacklist || [])
      } else {
        const res = await fetch('/api/admin/jobs?posted=true')
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleJobVisibility = async (jobId: string, currentlyHidden: boolean) => {
    try {
      const res = await fetch('/api/admin/jobs/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, hide: !currentlyHidden }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(currentlyHidden ? '공고가 복원되었습니다' : '공고가 숨김 처리되었습니다')
      fetchData()
    } catch {
      toast.error('공고 상태 변경에 실패했습니다')
    }
  }

  const addToBlacklist = async () => {
    if (!newWallet || !/^0x[a-fA-F0-9]{40}$/.test(newWallet)) {
      toast.error('유효하지 않은 지갑 주소입니다')
      return
    }
    try {
      const res = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: newWallet, reason: newReason }),
      })
      if (!res.ok) throw new Error('Failed to add')
      toast.success('지갑이 차단 목록에 추가되었습니다')
      setNewWallet('')
      setNewReason('')
      fetchData()
    } catch {
      toast.error('지갑 추가에 실패했습니다')
    }
  }

  const removeFromBlacklist = async (wallet: string) => {
    try {
      const res = await fetch('/api/admin/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('지갑이 차단 목록에서 삭제되었습니다')
      fetchData()
    } catch {
      toast.error('지갑 삭제에 실패했습니다')
    }
  }

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const tabs = [
    { id: 'jobs' as TabType, label: '공고', icon: Briefcase },
    { id: 'reports' as TabType, label: '신고', icon: Flag },
    { id: 'blacklist' as TabType, label: '차단 목록', icon: Ban },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Pixelbara pose="building" size={60} />
          <div>
            <h1 className="text-2xl font-bold">콘텐츠 관리</h1>
            <p className="text-sm text-muted-foreground">관리자 모드 활성화 -_-</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                사용자가 등록한 공고를 관리합니다. 신고가 많은 공고는 검토가 필요합니다.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">공고</th>
                      <th className="text-left px-4 py-3 font-medium">등록자</th>
                      <th className="text-left px-4 py-3 font-medium">신고</th>
                      <th className="text-left px-4 py-3 font-medium">상태</th>
                      <th className="text-left px-4 py-3 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          사용자 등록 공고 없음
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className={job.isHidden ? 'bg-red-500/5' : ''}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{job.title}</p>
                            <p className="text-xs text-muted-foreground">{job.company}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {job.postedBy ? truncateAddress(job.postedBy) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {job.reportCount > 0 ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                job.reportCount >= 5
                                  ? 'bg-red-500/10 text-red-500'
                                  : job.reportCount >= 3
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                <AlertTriangle className="w-3 h-3" />
                                {job.reportCount}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {job.isHidden ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs">
                                <EyeOff className="w-3 h-3" />
                                숨김
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-xs">
                                <Eye className="w-3 h-3" />
                                공개
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleJobVisibility(job.id, job.isHidden)}
                              className={`px-3 py-1 text-xs rounded transition-colors ${
                                job.isHidden
                                  ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                  : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                              }`}
                            >
                              {job.isHidden ? '복원' : '숨기기'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                사용자 신고를 검토합니다. 5회 이상 신고된 공고는 자동으로 숨김 처리됩니다.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">공고</th>
                      <th className="text-left px-4 py-3 font-medium">사유</th>
                      <th className="text-left px-4 py-3 font-medium">신고자</th>
                      <th className="text-left px-4 py-3 font-medium">날짜</th>
                      <th className="text-left px-4 py-3 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          신고 내역 없음
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-4 py-3">
                            {report.job ? (
                              <>
                                <p className="font-medium">{report.job.title}</p>
                                <p className="text-xs text-muted-foreground">{report.job.company}</p>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Job ID: {report.jobId}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-muted rounded text-xs">{report.reason}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {report.reporterWallet
                              ? truncateAddress(report.reporterWallet)
                              : report.reporterIp || 'Anonymous'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {report.job && !report.job.isHidden && (
                              <button
                                onClick={() => toggleJobVisibility(report.job!.id, false)}
                                className="px-3 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                              >
                                숨기기
                              </button>
                            )}
                            {report.job?.isHidden && (
                              <span className="text-xs text-muted-foreground">이미 숨김 처리됨</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Blacklist Tab */}
          {activeTab === 'blacklist' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                차단된 지갑은 공고를 등록할 수 없습니다. 3개 공고가 숨김 처리되면 자동 차단됩니다.
              </p>

              {/* Add wallet form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 max-w-md px-3 py-2 text-sm border rounded bg-background"
                />
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="사유 (선택)"
                  className="flex-1 max-w-xs px-3 py-2 text-sm border rounded bg-background"
                />
                <button
                  onClick={addToBlacklist}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">지갑</th>
                      <th className="text-left px-4 py-3 font-medium">사유</th>
                      <th className="text-left px-4 py-3 font-medium">추가일</th>
                      <th className="text-left px-4 py-3 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {blacklist.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          차단된 지갑 없음
                        </td>
                      </tr>
                    ) : (
                      blacklist.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-mono text-xs">{item.wallet}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.reason || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeFromBlacklist(item.wallet)}
                              className="flex items-center gap-1 px-3 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
