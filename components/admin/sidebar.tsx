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
    title: 'General',
    items: [
      { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: '/admin/moderation', label: 'Moderation', icon: <Flag className="h-4 w-4" /> },
      { href: '/admin/jobs/pending', label: 'Pending Jobs', icon: <Clock className="h-4 w-4" /> },
      { href: '/admin/jobs/duplicates', label: 'Duplicates', icon: <CopyCheck className="h-4 w-4" /> },
      { href: '/admin/errors', label: 'Error Logs', icon: <AlertCircle className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { href: '/admin/monitoring', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
      { href: '/admin/monitoring/errors', label: 'Error Dashboard', icon: <Shield className="h-4 w-4" /> },
      { href: '/admin/monitoring/proxies', label: 'Proxy Status', icon: <Radio className="h-4 w-4" /> },
      { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold px-2">Admin Dashboard</h2>
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
