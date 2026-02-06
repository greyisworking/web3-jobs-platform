import cron from 'node-cron'
import { exec } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'

const execAsync = promisify(exec)

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1465197779914592502/kyCCE7Ggbd19eBtY0nSQKgx2wiiYcOMY6TFNDBvSBnOtFj2LSML8gUq-b6t1p7_kkfP4'

// 3시간마다 크롤링
const scheduleEvery3Hours = '0 */3 * * *' // Every 3 hours

// 매일 새벽 4시에 만료 체크
const scheduleDaily4AM = '0 4 * * *' // Every day at 4 AM

// 매일 새벽 4:30에 추천 공고 새로고침
const scheduleDaily430AM = '30 4 * * *' // Every day at 4:30 AM

async function sendDiscordNotification(title: string, description: string, color: number, fields?: any[]) {
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
        footer: { text: 'Web3 Jobs Platform' }
      }]
    })
    console.log('✅ Discord notification sent!')
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error)
  }
}

console.log('🕐 Starting Auto-Crawl Scheduler...\n')
console.log('⏰ Crawling every 3 hours\n')

// 3시간마다 크롤링
cron.schedule(scheduleEvery3Hours, async () => {
  console.log(`\n⏰ [${new Date().toLocaleString()}] Starting scheduled crawl...`)
  
  const startTime = Date.now()
  
  // 시작 알림
  await sendDiscordNotification(
    '🚀 Starting Web3 Jobs Crawl',
    'Crawling 11 job sites...',
    0x3498db // Blue
  )
  
  try {
    const { stdout, stderr } = await execAsync('npm run crawl')
    console.log(stdout)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    
    // 성공 알림
    await sendDiscordNotification(
      '✅ Crawl Complete',
      `Successfully completed crawl in ${duration}s`,
      0x00ff00, // Green
      [
        {
          name: '⏱️ Duration',
          value: `${duration} seconds`,
          inline: true
        },
        {
          name: '📅 Time',
          value: new Date().toLocaleString(),
          inline: true
        }
      ]
    )
    
    if (stderr) console.error(stderr)
    console.log('✅ Scheduled crawl completed!')

    // Post-crawl: refresh featured jobs
    console.log('⭐ Refreshing featured jobs after crawl...')
    try {
      const { stdout: featuredOut } = await execAsync('npm run refresh:featured')
      console.log(featuredOut)
      await sendDiscordNotification(
        '⭐ Featured Jobs Refreshed',
        'Featured scores recalculated after crawl',
        0xf1c40f // Yellow
      )
    } catch (featuredErr: any) {
      console.error('❌ Featured refresh failed:', featuredErr)
    }
  } catch (error: any) {
    console.error('❌ Scheduled crawl failed:', error)

    // 실패 알림
    await sendDiscordNotification(
      '❌ Crawl Failed',
      `Error: ${error.message || error}`,
      0xff0000 // Red
    )
  }
})

console.log('✅ Crawl scheduled every 3 hours')

// 매일 새벽 4시에 만료된 공고 체크
cron.schedule(scheduleDaily4AM, async () => {
  console.log(`\n⏰ [${new Date().toLocaleString()}] Starting expired job check...`)

  const startTime = Date.now()

  await sendDiscordNotification(
    '🔍 Starting Expired Job Check',
    'Validating job URLs...',
    0x9b59b6 // Purple
  )

  try {
    const { stdout, stderr } = await execAsync('npm run check:expired -- --limit 200')
    console.log(stdout)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    // Parse results from stdout
    const expiredMatch = stdout.match(/❌ Expired: (\d+)/)
    const expiredCount = expiredMatch ? expiredMatch[1] : '0'

    await sendDiscordNotification(
      '✅ Expired Check Complete',
      `Found ${expiredCount} expired jobs`,
      0x9b59b6,
      [
        {
          name: '⏱️ Duration',
          value: `${duration} seconds`,
          inline: true
        },
        {
          name: '❌ Expired',
          value: expiredCount,
          inline: true
        }
      ]
    )

    if (stderr) console.error(stderr)
    console.log('✅ Expired check completed!')
  } catch (error: any) {
    console.error('❌ Expired check failed:', error)

    await sendDiscordNotification(
      '❌ Expired Check Failed',
      `Error: ${error.message || error}`,
      0xff0000
    )
  }
})

console.log('✅ Expired check scheduled daily at 4 AM')

// 매일 새벽 4:30에 추천 공고 새로고침
cron.schedule(scheduleDaily430AM, async () => {
  console.log(`\n⭐ [${new Date().toLocaleString()}] Starting featured jobs refresh...`)

  const startTime = Date.now()

  await sendDiscordNotification(
    '⭐ Starting Featured Refresh',
    'Recalculating featured job scores...',
    0xf1c40f // Yellow
  )

  try {
    const { stdout, stderr } = await execAsync('npm run refresh:featured')
    console.log(stdout)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    await sendDiscordNotification(
      '✅ Featured Refresh Complete',
      `Featured jobs updated in ${duration}s`,
      0xf1c40f,
      [
        {
          name: '⏱️ Duration',
          value: `${duration} seconds`,
          inline: true
        }
      ]
    )

    if (stderr) console.error(stderr)
    console.log('✅ Featured refresh completed!')
  } catch (error: any) {
    console.error('❌ Featured refresh failed:', error)

    await sendDiscordNotification(
      '❌ Featured Refresh Failed',
      `Error: ${error.message || error}`,
      0xff0000
    )
  }
})

console.log('✅ Featured refresh scheduled daily at 4:30 AM')

// 서버 시작 시 한 번 실행
console.log('\n🚀 Running initial crawl...\n')

const initialStartTime = Date.now()

sendDiscordNotification(
  '🚀 Starting Initial Crawl',
  'Web3 Jobs Platform started - running first crawl...',
  0x3498db
)

execAsync('npm run crawl')
  .then(({ stdout }) => {
    console.log(stdout)
    console.log('✅ Initial crawl completed!')
    
    const duration = ((Date.now() - initialStartTime) / 1000).toFixed(1)
    
    sendDiscordNotification(
      '🎉 Initial Crawl Complete',
      `Platform is now running! First crawl completed in ${duration}s`,
      0x00ff00,
      [
        {
          name: '⏱️ Duration',
          value: `${duration} seconds`,
          inline: true
        },
        {
          name: '⏰ Next Crawl',
          value: 'In 3 hours',
          inline: true
        }
      ]
    )
  })
  .catch((error) => {
    console.error('❌ Initial crawl failed:', error)
    sendDiscordNotification(
      '❌ Initial Crawl Failed',
      `Error: ${error.message || error}`,
      0xff0000
    )
  })

// 프로세스 종료 방지
process.stdin.resume()

console.log('\n📝 Scheduler is running...')
console.log('📱 Discord notifications enabled')
console.log('Press Ctrl+C to stop\n')

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down scheduler...')
  await sendDiscordNotification(
    '🛑 Scheduler Stopped',
    'Web3 Jobs Platform scheduler has been stopped',
    0xff9900
  )
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down scheduler...')
  await sendDiscordNotification(
    '🛑 Scheduler Stopped',
    'Web3 Jobs Platform scheduler has been stopped',
    0xff9900
  )
  process.exit(0)
})
