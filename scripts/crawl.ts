import 'dotenv/config'
import { crawlPriorityCompanies } from './crawlers/priority-companies'
import { crawlWeb3Career } from './crawlers/web3career'
import { crawlWeb3KRJobs } from './crawlers/web3krjobs'
import { crawlCryptoJobsList } from './crawlers/cryptojobslist'
import { crawlRemote3 } from './crawlers/remote3'
import { crawlRemoteOK } from './crawlers/remoteok'
import { crawlRocketPunch } from './crawlers/rocketpunch'
import { crawlSuiJobs } from './crawlers/suijobs'
import { crawlSolanaJobs } from './crawlers/solanajobs'
import { crawlEthereumJobs } from './crawlers/ethereum'
import { crawlAvalancheJobs } from './crawlers/avalanchejobs'
import { crawlArbitrumJobs } from './crawlers/arbitrumjobs'
import axios from 'axios'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''

interface CrawlResult {
  source: string
  status: 'success' | 'failed'
  jobCount: number
  error?: string
}

async function sendDiscordNotification(title: string, description: string, color: number, fields?: any[]) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('⚠️  Discord webhook not configured, skipping notification')
    return
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'Web3 Jobs Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
      embeds: [{
        title,
        description,
        color,
        fields: fields || [],
        timestamp: new Date().toISOString(),
        footer: { text: 'Web3 Jobs Platform • GitHub Actions' }
      }]
    })
    console.log('✅ Discord notification sent!')
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error)
  }
}

async function main() {
  console.log('🌐 Starting Web3 Jobs Crawler...\n')
  console.log('='.repeat(50))
  
  const startTime = Date.now()
  const results: CrawlResult[] = []

  // 시작 알림
  await sendDiscordNotification(
    '🚀 Starting Crawl',
    'GitHub Actions crawler started - collecting jobs from 12 sources',
    0x3498db
  )

  // Tier 1 크롤러
  console.log('\n📌 Tier 1 Crawlers\n')
  
  const crawlers = [
    { name: 'priority-companies', fn: crawlPriorityCompanies },
    { name: 'web3.career', fn: crawlWeb3Career },
    { name: 'web3kr.jobs', fn: crawlWeb3KRJobs },
    { name: 'cryptojobslist.com', fn: crawlCryptoJobsList },
    { name: 'remote3.co', fn: crawlRemote3 },
    { name: 'remoteok.com', fn: crawlRemoteOK },
    { name: 'rocketpunch.com', fn: crawlRocketPunch },
    { name: 'jobs.sui.io', fn: crawlSuiJobs },
    { name: 'jobs.solana.com', fn: crawlSolanaJobs },
    { name: 'ethereum.foundation', fn: crawlEthereumJobs },
    { name: 'jobs.avax.network', fn: crawlAvalancheJobs },
    { name: 'jobs.arbitrum.io', fn: crawlArbitrumJobs },
  ]

  for (const crawler of crawlers) {
    try {
      const count = await crawler.fn()
      results.push({ source: crawler.name, status: 'success', jobCount: count })
      console.log(`✅ ${crawler.name}: ${count} jobs`)
    } catch (error: any) {
      console.error(`❌ ${crawler.name}:`, error.message)
      results.push({ source: crawler.name, status: 'failed', jobCount: 0, error: error.message })
    }
  }

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  const totalJobs = results.reduce((sum, r) => sum + r.jobCount, 0)
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length

  console.log('\n' + '='.repeat(50))
  console.log(`\n✨ Crawling Complete!`)
  console.log(`📊 Total: ${totalJobs} jobs`)
  console.log(`✅ Success: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${failedCount}/${results.length}`)
  console.log(`⏱️  Duration: ${duration.toFixed(1)}s\n`)

  // 완료 알림
  const successList = results
    .filter(r => r.status === 'success' && r.jobCount > 0)
    .map(r => `✅ **${r.source}**: ${r.jobCount} jobs`)
    .slice(0, 10)
    .join('\n') || 'None'

  const failedList = results
    .filter(r => r.status === 'failed')
    .map(r => `❌ **${r.source}**`)
    .slice(0, 10)
    .join('\n') || 'None'

  await sendDiscordNotification(
    failedCount === 0 ? '🎉 Crawl Complete!' : '⚠️ Crawl Complete (with errors)',
    `Successfully collected ${totalJobs} jobs from ${successCount} sources`,
    failedCount === 0 ? 0x00ff00 : 0xffa500,
    [
      {
        name: '📊 Summary',
        value: `**Total Jobs**: ${totalJobs}\n**Sources**: ${successCount}/${results.length} successful\n**Duration**: ${duration.toFixed(1)}s`,
        inline: false
      },
      {
        name: '✅ Successful Sources',
        value: successList,
        inline: false
      },
      ...(failedCount > 0 ? [{
        name: '❌ Failed Sources',
        value: failedList,
        inline: false
      }] : [])
    ]
  )

}

main()
  .catch(async (error) => {
    console.error('🚨 Fatal error:', error)
    await sendDiscordNotification(
      '🚨 Fatal Error',
      `Crawler crashed: ${error.message || error}`,
      0xff0000,
      [{
        name: 'Error Details',
        value: `\`\`\`${error.stack?.substring(0, 500) || error}\`\`\``,
        inline: false
      }]
    )
    process.exit(1)
  })
