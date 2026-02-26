/**
 * Backfill JD for jobs.solana.com jobs that link to known platforms
 * (Greenhouse, Ashby, Lever, Workable)
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { delay } from './utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface JobRow {
  id: string
  url: string
  title: string
  company: string
}

// Fetch JD from Greenhouse API
async function fetchGreenhouseJD(url: string): Promise<string | null> {
  try {
    // Extract board token and job ID from URL
    // Format: https://boards.greenhouse.io/{board}/jobs/{id}
    const match = url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
    if (!match) return null

    const [, board, jobId] = match
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}`
    const { data } = await axios.get(apiUrl, { timeout: 10000 })
    return data?.content || null
  } catch {
    return null
  }
}

// Fetch JD from Ashby API
async function fetchAshbyJD(url: string): Promise<string | null> {
  try {
    // Extract org and job ID from URL
    // Format: https://jobs.ashbyhq.com/{org}/{jobId}
    const match = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([^/?]+)/)
    if (!match) return null

    const [, org, jobId] = match
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${org}/posting/${jobId}`
    const { data } = await axios.get(apiUrl, {
      headers: { Accept: 'application/json' },
      timeout: 10000
    })
    return data?.descriptionHtml || data?.description || null
  } catch {
    return null
  }
}

// Fetch JD from Lever API
async function fetchLeverJD(url: string): Promise<string | null> {
  try {
    // Extract company and job ID from URL
    // Format: https://jobs.lever.co/{company}/{jobId}
    const match = url.match(/jobs\.lever\.co\/([^/]+)\/([^/?]+)/)
    if (!match) return null

    const [, company, jobId] = match
    const apiUrl = `https://api.lever.co/v0/postings/${company}/${jobId}`
    const { data } = await axios.get(apiUrl, { timeout: 10000 })
    return data?.descriptionPlain || data?.description || null
  } catch {
    return null
  }
}

// Fetch JD from Workable (scrape)
async function fetchWorkableJD(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html'
      },
      timeout: 10000
    })

    // Extract from JSON-LD
    const jsonLdMatch = data.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (jsonLdMatch) {
      const jsonLd = JSON.parse(jsonLdMatch[1])
      if (jsonLd.description) return jsonLd.description
    }

    // Fallback: extract from meta description
    const metaMatch = data.match(/<meta name="description" content="([^"]+)"/)
    if (metaMatch) return metaMatch[1]

    return null
  } catch {
    return null
  }
}

// Fetch JD from Notion page
async function fetchNotionJD(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    })

    // Extract text content from Notion's SSR HTML
    // Notion pages have content in various formats

    // Try to get description from meta tags first
    const ogDescMatch = data.match(/<meta property="og:description" content="([^"]+)"/)
    if (ogDescMatch && ogDescMatch[1].length > 100) {
      return ogDescMatch[1]
    }

    // Extract from twitter:description
    const twitterDescMatch = data.match(/<meta name="twitter:description" content="([^"]+)"/)
    if (twitterDescMatch && twitterDescMatch[1].length > 100) {
      return twitterDescMatch[1]
    }

    // Look for JSON data in script tags
    const jsonMatches = data.matchAll(/<script[^>]*>(\{[^<]*"block"[^<]*\})<\/script>/g)
    for (const match of jsonMatches) {
      try {
        const json = JSON.parse(match[1])
        // Try to extract text from Notion block structure
        const blocks = json.recordMap?.block || {}
        let text = ''
        for (const blockId of Object.keys(blocks)) {
          const block = blocks[blockId]?.value
          if (block?.properties?.title) {
            const titles = block.properties.title
            for (const t of titles) {
              if (Array.isArray(t) && t[0]) {
                text += t[0] + ' '
              }
            }
          }
        }
        if (text.length > 100) return text.trim()
      } catch {}
    }

    // Fallback: extract visible text from body
    // Remove script/style tags and get text
    let bodyText = data.replace(/<script[\s\S]*?<\/script>/gi, '')
    bodyText = bodyText.replace(/<style[\s\S]*?<\/style>/gi, '')
    bodyText = bodyText.replace(/<[^>]+>/g, ' ')
    bodyText = bodyText.replace(/\s+/g, ' ').trim()

    // Get a reasonable chunk of text
    if (bodyText.length > 200) {
      // Find job-related content
      const startIdx = bodyText.toLowerCase().indexOf('about')
      if (startIdx > 0) {
        return bodyText.slice(startIdx, startIdx + 3000).trim()
      }
      return bodyText.slice(0, 3000).trim()
    }

    return null
  } catch (err) {
    return null
  }
}

async function main() {
  console.log('🔄 Backfilling JD for jobs.solana.com...\n')

  // Get jobs without description
  const { data: _jobs, error } = await supabase
    .from('Job')
    .select('id, url, title, company')
    .eq('source', 'jobs.solana.com')
    .eq('isActive', true)
    .or('description.is.null,description.eq.')

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  // Also get jobs with very short descriptions
  const { data: shortDescJobs } = await supabase
    .from('Job')
    .select('id, url, title, company, description')
    .eq('source', 'jobs.solana.com')
    .eq('isActive', true)

  const noDescJobs = shortDescJobs?.filter(
    j => !j.description || j.description.length < 50
  ) as JobRow[] || []

  console.log(`Found ${noDescJobs.length} jobs without JD\n`)

  let updated = 0
  let failed = 0

  for (const job of noDescJobs) {
    const url = job.url
    let description: string | null = null
    let platform = ''

    try {
      if (url.includes('boards.greenhouse.io')) {
        platform = 'Greenhouse'
        description = await fetchGreenhouseJD(url)
      } else if (url.includes('jobs.ashbyhq.com')) {
        platform = 'Ashby'
        description = await fetchAshbyJD(url)
      } else if (url.includes('jobs.lever.co')) {
        platform = 'Lever'
        description = await fetchLeverJD(url)
      } else if (url.includes('apply.workable.com')) {
        platform = 'Workable'
        description = await fetchWorkableJD(url)
      } else if (url.includes('notion.site') || url.includes('notion.so')) {
        platform = 'Notion'
        description = await fetchNotionJD(url)
      } else {
        // Skip unsupported platforms
        continue
      }

      if (description && description.length > 50) {
        const { error: updateError } = await supabase
          .from('Job')
          .update({
            description,
            raw_description: description
          })
          .eq('id', job.id)

        if (!updateError) {
          console.log(`✅ ${platform}: ${job.title.slice(0, 40)}... (${description.length} chars)`)
          updated++
        } else {
          console.log(`❌ Update failed: ${job.title.slice(0, 40)}`)
          failed++
        }
      } else {
        console.log(`⚠️  ${platform}: No JD found - ${job.title.slice(0, 40)}`)
      }

      await delay(200)
    } catch (err) {
      console.log(`❌ Error: ${job.title.slice(0, 40)} - ${err}`)
      failed++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Skipped: ${noDescJobs.length - updated - failed} (unsupported platforms)`)
}

main().catch(console.error)
