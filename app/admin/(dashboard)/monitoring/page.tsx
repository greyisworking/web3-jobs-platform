'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SummaryCards } from '@/components/admin/SummaryCards'
import { useMonitoringStats } from '@/hooks/use-monitoring-stats'
import { MonitoringOverview } from './overview'
import { MonitoringErrorsTab } from './errors-tab'
import { MonitoringProxiesTab } from './proxies-tab'
import { MonitoringCrawlHistoryTab } from './crawl-history-tab'
import { MonitoringAnalyticsTab } from './analytics-tab'

export default function MonitoringPage() {
  const { stats, isLoading: statsLoading } = useMonitoringStats()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Monitoring</h1>

      <SummaryCards stats={stats} isLoading={statsLoading} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="proxies">Proxies</TabsTrigger>
          <TabsTrigger value="crawl-history">Crawl History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <MonitoringOverview />
        </TabsContent>
        <TabsContent value="errors">
          <MonitoringErrorsTab />
        </TabsContent>
        <TabsContent value="proxies">
          <MonitoringProxiesTab />
        </TabsContent>
        <TabsContent value="crawl-history">
          <MonitoringCrawlHistoryTab />
        </TabsContent>
        <TabsContent value="analytics">
          <MonitoringAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
