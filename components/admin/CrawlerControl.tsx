'use client'

import { useState } from 'react'
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CrawlerRunResponse } from '@/types/analytics'

type CrawlerStatus = 'idle' | 'running' | 'success' | 'failed'

export function CrawlerControl() {
  const [status, setStatus] = useState<CrawlerStatus>('idle')
  const [output, setOutput] = useState<string>('')
  const [message, setMessage] = useState<string>('')

  const runCrawler = async () => {
    setStatus('running')
    setOutput('')
    setMessage('크롤러 시작 중...')

    try {
      const res = await fetch('/api/admin/crawler/run', { method: 'POST' })
      const data: CrawlerRunResponse = await res.json()

      if (res.status === 429) {
        setStatus('failed')
        setMessage(data.message)
        return
      }

      setStatus(data.success ? 'success' : 'failed')
      setMessage(data.message)
      setOutput(data.output || '')
    } catch (err) {
      setStatus('failed')
      setMessage('네트워크 오류 - 서버에 연결할 수 없습니다')
    }
  }

  const statusIcon = {
    idle: null,
    running: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    failed: <XCircle className="h-4 w-4 text-destructive" />,
  }

  const statusLabel = {
    idle: '대기 중',
    running: '실행 중...',
    success: '성공',
    failed: '실패',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">크롤러 제어</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={runCrawler}
            disabled={status === 'running'}
            className="gap-2"
          >
            {status === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            크롤러 실행
          </Button>
          <div className="flex items-center gap-2 text-sm">
            {statusIcon[status]}
            <span
              className={
                status === 'success'
                  ? 'text-green-600'
                  : status === 'failed'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }
            >
              {statusLabel[status]}
            </span>
          </div>
        </div>

        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}

        {output && (
          <div className="rounded-md border bg-muted p-3 max-h-64 overflow-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
