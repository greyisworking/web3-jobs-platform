'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Clock,
  CopyCheck,
  AlertCircle,
  Activity,
  Radio,
  Shield,
  BarChart3,
  Flag,
  Star,
  Mail,
  Sparkles,
  FileBarChart,
  HelpCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  description?: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: '일반',
    description: '공고 관리와 기본 설정',
    items: [
      {
        href: '/admin',
        label: '대시보드',
        description: '전체 현황을 한눈에 볼 수 있어요',
        icon: <LayoutDashboard className="h-4 w-4" />
      },
      {
        href: '/admin/moderation',
        label: '콘텐츠 관리',
        description: '사용자가 올린 공고를 검토하고 관리해요',
        icon: <Flag className="h-4 w-4" />
      },
      {
        href: '/admin/jobs/pending',
        label: '검토 대기',
        description: '승인 대기 중인 공고를 확인해요',
        icon: <Clock className="h-4 w-4" />
      },
      {
        href: '/admin/jobs/featured',
        label: '추천 공고',
        description: '메인에 노출될 추천 공고를 관리해요',
        icon: <Star className="h-4 w-4" />
      },
      {
        href: '/admin/jobs/duplicates',
        label: '중복 공고',
        description: '같은 공고가 여러 개 있는지 확인해요',
        icon: <CopyCheck className="h-4 w-4" />
      },
      {
        href: '/admin/errors',
        label: '오류 기록',
        description: '시스템 오류 내역을 확인해요',
        icon: <AlertCircle className="h-4 w-4" />
      },
    ],
  },
  {
    title: '모니터링',
    description: '시스템 상태 확인',
    items: [
      {
        href: '/admin/monitoring',
        label: '크롤링 현황',
        description: '채용 공고 자동 수집 현황',
        icon: <Activity className="h-4 w-4" />
      },
      {
        href: '/admin/monitoring/errors',
        label: '오류 대시보드',
        description: '최근 발생한 오류를 분석해요',
        icon: <Shield className="h-4 w-4" />
      },
      {
        href: '/admin/monitoring/proxies',
        label: '프록시 상태',
        description: '크롤링용 서버 상태 확인',
        icon: <Radio className="h-4 w-4" />
      },
      {
        href: '/admin/analytics',
        label: '통계',
        description: '검색어, 방문자 등 사용 통계예요',
        icon: <BarChart3 className="h-4 w-4" />
      },
    ],
  },
  {
    title: '마케팅',
    description: '뉴스레터와 콘텐츠',
    items: [
      {
        href: '/admin/newsletter',
        label: '뉴스레터 생성',
        description: '매주 채용 뉴스레터 만들기',
        icon: <Mail className="h-4 w-4" />
      },
      {
        href: '/admin/report',
        label: '월간 리포트',
        description: '월간 시장 동향 리포트 생성',
        icon: <FileBarChart className="h-4 w-4" />
      },
      {
        href: '/admin/content-generator',
        label: '콘텐츠 생성기',
        description: 'AI로 글쓰기 (루디움/NEUN용)',
        icon: <Sparkles className="h-4 w-4" />
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold px-2">관리자 대시보드</h2>
        <p className="text-xs text-muted-foreground px-2 mt-1">NEUN 채용 플랫폼 관리</p>
      </div>
      <nav className="space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-1 px-3 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
              {section.description && (
                <div className="relative group">
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                  <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                    <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
                      {section.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : item.href === '/admin/monitoring'
                      ? pathname === '/admin/monitoring'
                      : pathname.startsWith(item.href)

                return (
                  <div key={item.href} className="relative">
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                    {/* Tooltip - only render client-side to prevent hydration mismatch */}
                    {mounted && hoveredItem === item.href && !isActive && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                        <div className="bg-popover text-popover-foreground text-xs px-2 py-1.5 rounded shadow-lg whitespace-nowrap border max-w-[200px]">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer help text */}
      <div className="mt-8 px-3 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          💡 메뉴에 마우스를 올리면 설명이 나와요
        </p>
      </div>
    </aside>
  )
}
