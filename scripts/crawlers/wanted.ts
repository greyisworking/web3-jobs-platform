import puppeteer, { Page } from 'puppeteer'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

interface JobListing {
  title: string
  company: string
  location: string
  type: string
  url: string
  salary?: string
  tags?: string[]
}

/**
 * Fetch job description from Wanted detail page
 */
async function fetchJobDescription(page: Page, url: string): Promise<{
  description: string | null
  requirements: string | null
  benefits: string | null
}> {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })

    // Wait for job content to load
    await page.waitForSelector('[class*="JobDescription"], [class*="job-description"], .job-content', { timeout: 5000 }).catch(() => {})

    const content = await page.evaluate(() => {
      let description = ''
      let requirements = ''
      let benefits = ''

      // Wanted uses sections with headers
      const sections = document.querySelectorAll('[class*="JobDescription"] section, .job-section, [class*="section"]')

      sections.forEach(section => {
        const header = section.querySelector('h2, h3, h6, [class*="header"], [class*="title"]')?.textContent?.trim().toLowerCase() || ''
        const content = section.querySelector('[class*="content"], p, div:not([class*="header"])')?.textContent?.trim() || ''

        if (header.includes('주요업무') || header.includes('담당업무') || header.includes('업무') || header.includes('role')) {
          description = content
        } else if (header.includes('자격요건') || header.includes('우대') || header.includes('requirement') || header.includes('qualification')) {
          requirements = content
        } else if (header.includes('혜택') || header.includes('복지') || header.includes('benefit')) {
          benefits = content
        }
      })

      // Fallback: get all text from description area
      if (!description) {
        const descEl = document.querySelector('[class*="JobDescription"], .job-content, [class*="description"]')
        if (descEl) {
          description = descEl.textContent?.trim().slice(0, 5000) || ''
        }
      }

      return { description, requirements, benefits }
    })

    return content
  } catch (error) {
    return { description: null, requirements: null, benefits: null }
  }
}

/**
 * Extract tags from Wanted job listing
 */
async function extractTags(page: Page): Promise<string[]> {
  try {
    return await page.evaluate(() => {
      const tags: string[] = []

      // Wanted shows tags/skills as badges
      const tagEls = document.querySelectorAll('[class*="Tag"], [class*="tag"], [class*="skill"], .skill-tag, .tech-stack span')
      tagEls.forEach(el => {
        const tag = el.textContent?.trim()
        if (tag && tag.length < 30) {
          tags.push(tag)
        }
      })

      return tags.slice(0, 10)
    })
  } catch {
    return []
  }
}

export async function crawlWanted(): Promise<CrawlerReturn> {
  console.log('🔵 Starting 원티드(Wanted) crawler...')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Search for blockchain/web3 jobs on Wanted
    // Wanted uses category IDs and search params
    const searchUrls = [
      'https://www.wanted.co.kr/search?query=블록체인&tab=position',
      'https://www.wanted.co.kr/search?query=web3&tab=position',
      'https://www.wanted.co.kr/search?query=스마트컨트랙트&tab=position',
      'https://www.wanted.co.kr/search?query=DeFi&tab=position',
    ]

    const allJobs: JobListing[] = []

    for (const searchUrl of searchUrls) {
      console.log(`  🔍 Searching: ${searchUrl.split('query=')[1]?.split('&')[0]}`)

      try {
        await page.goto(searchUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        })

        // Wait for job cards to render
        await page.waitForSelector('[class*="JobCard"], [class*="job-card"], .position-card', { timeout: 10000 }).catch(() => {
          console.log('    ⚠️  Selector timeout')
        })

        // Scroll to load more jobs
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await delay(1000)

        // Extract jobs from this search
        const jobs = await page.evaluate(() => {
          const results: JobListing[] = []

          // Wanted job card structure
          const jobCards = document.querySelectorAll('[class*="JobCard"], [class*="job-card"], .position-card, [data-position-id]')

          jobCards.forEach((card) => {
            const linkEl = card.querySelector('a')
            const titleEl = card.querySelector('[class*="job-title"], [class*="JobCard_title"], h2, strong')
            const companyEl = card.querySelector('[class*="company"], [class*="JobCard_company"], .company-name')
            const locationEl = card.querySelector('[class*="location"], [class*="JobCard_location"]')
            const rewardEl = card.querySelector('[class*="reward"], [class*="compensation"]')

            const title = titleEl?.textContent?.trim() || ''
            const company = companyEl?.textContent?.trim() || ''
            const location = locationEl?.textContent?.trim() || '서울'
            let url = (linkEl as HTMLAnchorElement)?.href || ''

            // Make sure URL is absolute
            if (url && !url.startsWith('http')) {
              url = 'https://www.wanted.co.kr' + url
            }

            const salary = rewardEl?.textContent?.trim()

            if (title && company && url) {
              // Avoid duplicates
              if (!results.some(r => r.url === url)) {
                results.push({ title, company, location, type: '정규직', url, salary })
              }
            }
          })

          return results
        })

        allJobs.push(...jobs)
        console.log(`    📦 Found ${jobs.length} jobs`)

        await delay(1000) // Rate limit between searches
      } catch (err) {
        console.log(`    ❌ Search failed: ${err}`)
      }
    }

    // Remove duplicates based on URL
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.url === job.url)
    )

    console.log(`📦 Total unique jobs: ${uniqueJobs.length}`)

    let savedCount = 0
    let newCount = 0

    for (const job of uniqueJobs) {
      try {
        console.log(`  📄 Fetching: ${job.title.slice(0, 40)}...`)

        const { description, requirements, benefits } = await fetchJobDescription(page, job.url)
        const tags = await extractTags(page)

        // Combine description sections
        let fullDescription = ''
        if (description) fullDescription += `## 주요업무\n${description}\n\n`
        if (requirements) fullDescription += `## 자격요건\n${requirements}\n\n`
        if (benefits) fullDescription += `## 혜택 및 복지\n${benefits}\n\n`

        if (fullDescription) {
          console.log(`    ✅ Got description (${fullDescription.length} chars)`)
        }

        await delay(800) // Rate limit for Wanted

        const result = await validateAndSaveJob(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            location: job.location,
            type: job.type,
            salary: job.salary,
            category: 'Engineering',
            tags: tags.length > 0 ? tags : ['블록체인', 'Web3', 'Korea'],
            source: 'wanted.co.kr',
            region: 'Korea',
            postedDate: new Date(),
            description: fullDescription || undefined,
          },
          'wanted.co.kr'
        )
        if (result.saved) savedCount++
        if (result.isNew) newCount++
      } catch (error) {
        console.error('Error saving Wanted job:', error)
      }
    }

    await supabase.from('CrawlLog').insert({
      source: 'wanted.co.kr',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} jobs from 원티드 (${newCount} new)`)
    return { total: savedCount, new: newCount }
  } catch (error) {
    console.error('❌ Wanted crawler error:', error)

    await supabase.from('CrawlLog').insert({
      source: 'wanted.co.kr',
      status: 'failed',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
