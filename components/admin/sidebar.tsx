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
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: '일반',
    items: [
      { href: '/admin', label: '대시보드', icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: '/admin/moderation', label: '콘텐츠 관리', icon: <Flag className="h-4 w-4" /> },
      { href: '/admin/jobs/pending', label: '검토 대기', icon: <Clock className="h-4 w-4" /> },
      { href: '/admin/jobs/featured', label: '추천 공고', icon: <Star className="h-4 w-4" /> },
      { href: '/admin/jobs/duplicates', label: '중복 공고', icon: <CopyCheck className="h-4 w-4" /> },
      { href: '/admin/errors', label: '오류 기록', icon: <AlertCircle className="h-4 w-4" /> },
    ],
  },
  {
    title: '모니터링',
    items: [
      { href: '/admin/monitoring', label: '전체 현황', icon: <Activity className="h-4 w-4" /> },
      { href: '/admin/monitoring/errors', label: '오류 대시보드', icon: <Shield className="h-4 w-4" /> },
      { href: '/admin/monitoring/proxies', label: '프록시 상태', icon: <Radio className="h-4 w-4" /> },
      { href: '/admin/analytics', label: '통계', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold px-2">관리자 대시보드</h2>
      </div>
      <nav className="space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : item.href === '/admin/monitoring'
                      ? pathname === '/admin/monitoring'
                      : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
