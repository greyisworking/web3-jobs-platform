'use client'

import { CrawlerControl } from '@/components/admin/CrawlerControl'
import { CrawlSchedule } from '@/components/admin/CrawlSchedule'

export function DashboardCrawlerSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CrawlerControl />
      <CrawlSchedule />
    </div>
  )
}
