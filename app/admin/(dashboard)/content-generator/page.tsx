'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Sparkles, Copy, RotateCcw, Save, FileText, Briefcase, BookOpen, Loader2, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ContentMode = 'newsletter' | 'ludium-jobs' | 'ludium-article'

interface GeneratedContent {
  english: string
  korean: string | null
  raw: string
}

interface UsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
}

const MODE_CONFIG = {
  'newsletter': {
    label: '뉴스레터',
    description: 'NEUN 주간 뉴스레터 (영문)',
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    dualLanguage: false,
  },
  'ludium-jobs': {
    label: '루디움 채용',
    description: '루디움용 채용공고 (영문 + 한글)',
    icon: Briefcase,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    dualLanguage: true,
  },
  'ludium-article': {
    label: '루디움 아티클',
    description: '교육용 아티클 (영문 + 한글)',
    icon: BookOpen,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    dualLanguage: true,
  },
}

const SAMPLE_PROMPTS = {
  'newsletter': 'Write this week\'s NEUN newsletter highlighting the top 10 Web3 job opportunities. Focus on engineering roles and VC-backed companies.',
  'ludium-jobs': 'Create a job listing post for these 5 exciting Web3 positions. Make it engaging and accessible for newcomers to the space.',
  'ludium-article': 'Write an article explaining "How to Break into Web3 Development in 2026" for beginners. Cover the essential skills, learning resources, and job hunting tips.',
}

export default function ContentGeneratorPage() {
  const [mode, setMode] = useState<ContentMode>('newsletter')
  const [prompt, setPrompt] = useState('')
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'english' | 'korean'>('english')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해 주세요')
      return
    }

    setLoading(true)
    setError(null)
    setContent(null)
    setEditMode(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('콘텐츠 생성기를 사용하려면 로그인해 주세요')
        return
      }

      const response = await fetch('/api/admin/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode,
          prompt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setContent(data.content)
      setEditedContent(data.content)
      setUsage(data.usage)

      // Switch to Korean tab if available
      if (data.content.korean && mode !== 'newsletter') {
        setActiveTab('english')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요')
    } finally {
      setLoading(false)
    }
  }, [mode, prompt])

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }, [])

  const handleRegenerate = useCallback(() => {
    handleGenerate()
  }, [handleGenerate])

  const handleSave = useCallback(async () => {
    if (!editedContent) return

    // For now, just copy to clipboard and show success
    const textToSave = activeTab === 'korean' && editedContent.korean
      ? editedContent.korean
      : editedContent.english

    await navigator.clipboard.writeText(textToSave)
    setCopiedField('save')
    setTimeout(() => setCopiedField(null), 2000)
  }, [editedContent, activeTab])

  const handleUseSamplePrompt = useCallback(() => {
    setPrompt(SAMPLE_PROMPTS[mode])
  }, [mode])

  const currentContent = editMode ? editedContent : content
  const displayContent = activeTab === 'korean' && currentContent?.korean
    ? currentContent.korean
    : currentContent?.english || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Sparkles className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">콘텐츠 생성기</h1>
          <p className="text-sm text-muted-foreground">
            Claude로 AI 콘텐츠 만들기
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(MODE_CONFIG) as [ContentMode, typeof MODE_CONFIG[ContentMode]][]).map(
          ([key, config]) => {
            const Icon = config.icon
            const isActive = mode === key

            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? `border-primary ${config.bgColor}`
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <span className="font-semibold">{config.label}</span>
                  {config.dualLanguage && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      EN + KR
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </button>
            )
          }
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">프롬프트</label>
          <button
            onClick={handleUseSamplePrompt}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            예시 프롬프트 사용
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`생성할 콘텐츠를 설명해 주세요...\n\n예시: ${SAMPLE_PROMPTS[mode]}`}
          className="w-full h-32 px-4 py-3 rounded-lg border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                생성하기
              </>
            )}
          </button>
          {usage && (
            <span className="text-xs text-muted-foreground">
              {usage.totalTokens.toLocaleString()} 토큰 | ${usage.costUsd.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Output Section */}
      {currentContent && (
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Tabs for dual language */}
          {MODE_CONFIG[mode].dualLanguage && currentContent.korean && (
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('english')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'english'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                영문
              </button>
              <button
                onClick={() => setActiveTab('korean')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'korean'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                한글
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <button
              onClick={() => handleCopy(displayContent, 'content')}
              className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 hover:bg-muted transition-colors"
            >
              {copiedField === 'content' ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  복사
                </>
              )}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              다시 생성
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                editMode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              편집
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 hover:bg-muted transition-colors ml-auto"
            >
              {copiedField === 'save' ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  클립보드에 저장됨!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  저장
                </>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {editMode ? (
              <textarea
                value={
                  activeTab === 'korean' && editedContent?.korean
                    ? editedContent.korean
                    : editedContent?.english || ''
                }
                onChange={(e) => {
                  if (!editedContent) return
                  if (activeTab === 'korean') {
                    setEditedContent({ ...editedContent, korean: e.target.value })
                  } else {
                    setEditedContent({ ...editedContent, english: e.target.value })
                  }
                }}
                className="w-full min-h-[400px] p-4 rounded-lg border bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!content && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">아직 생성된 콘텐츠가 없어요</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            콘텐츠 유형을 선택하고 프롬프트를 입력한 후
            생성하기 버튼을 눌러 Claude로 콘텐츠를 만들어 보세요.
          </p>
        </div>
      )}
    </div>
  )
}
