/**
 * Re-crawl job descriptions for existing jobs
 * This script fetches descriptions from source URLs for jobs that don't have them
 */

import { PrismaClient } from '@prisma/client'
import { fetchHTML, delay, cleanText, extractHTML, detectExperienceLevel, detectRemoteType } from './utils'

const prisma = new PrismaClient()

interface JobDetails {
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  experienceLevel?: string
  remoteType?: string
  companyLogo?: string
  companyWebsite?: string
}

/**
 * Generic job detail fetcher that works across multiple sources
 */
async function fetchJobDetailsFromUrl(url: string, source: string): Promise<JobDetails> {
  const $ = await fetchHTML(url)
  if (!$) return {}

  const details: JobDetails = {}

  try {
    // Different selectors based on source
    let descriptionSelectors: string[] = []

    switch (source) {
      case 'web3.career':
        descriptionSelectors = ['.job-description', '.job-content', '[class*="description"]', 'article']
        break
      case 'remoteok.com':
        descriptionSelectors = ['.description', '.job-description', '.markdown', '[class*="description"]']
        break
      case 'remote3.co':
        descriptionSelectors = ['.job-content', '.description', 'article', '[class*="content"]']
        break
      case 'jobs.solana.com':
      case 'jobs.sui.io':
        descriptionSelectors = ['[class*="description"]', '.job-description', '.content', 'article']
        break
      case 'ethereum.foundation':
        descriptionSelectors = ['.job-description', '[data-testid="description"]', 'article', '.content']
        break
      default:
        descriptionSelectors = ['.job-description', '.description', '[class*="description"]', 'article', '.content', 'main']
    }

    // Try each selector until we find content
    for (const selector of descriptionSelectors) {
      const el = $(selector).first()
      if (el.length) {
        const text = extractHTML(el, $)
        if (text && text.length > 100) { // Only accept if substantial content
          details.description = text
          break
        }
      }
    }

    // Look for sections with common headers
    $('h2, h3, h4, strong, b').each((_, el) => {
      const header = cleanText($(el).text()).toLowerCase()
      const content = $(el).nextUntil('h2, h3, h4, strong, b').text()
      const cleanedContent = cleanText(content)

      if (cleanedContent.length < 20) return // Skip short content

      if (!details.requirements && (
        header.includes('requirement') ||
        header.includes('qualif') ||
        header.includes('looking for') ||
        header.includes('must have') ||
        header.includes('자격')
      )) {
        details.requirements = cleanedContent
      }
      if (!details.responsibilities && (
        header.includes('responsib') ||
        header.includes('what you') ||
        header.includes('duties') ||
        header.includes('role') ||
        header.includes('담당')
      )) {
        details.responsibilities = cleanedContent
      }
      if (!details.benefits && (
        header.includes('benefit') ||
        header.includes('perk') ||
        header.includes('we offer') ||
        header.includes('복리')
      )) {
        details.benefits = cleanedContent
      }
    })

    // Experience level detection from full page text
    const fullText = $('body').text()
    details.experienceLevel = detectExperienceLevel(fullText) || undefined
    details.remoteType = detectRemoteType(fullText) || undefined

    // Company logo
    const logoImg = $('img[src*="logo"], .company-logo img, .logo img').first()
    if (logoImg.length) {
      const logoSrc = logoImg.attr('src')
      if (logoSrc && !logoSrc.includes('placeholder') && !logoSrc.includes('data:')) {
        details.companyLogo = logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, url).href
      }
    }

    // Company website
    const websiteLink = $('a[href*="company"], a:contains("website"), a:contains("Visit"), a[rel="noopener"]').first()
    if (websiteLink.length) {
      const href = websiteLink.attr('href')
      if (href && href.startsWith('http') && !href.includes(new URL(url).hostname)) {
        details.companyWebsite = href
      }
    }

  } catch (error) {
    console.error(`  ❌ Error parsing ${url}:`, error)
  }

  return details
}

async function recrawlDescriptions() {
  console.log('🔄 Starting re-crawl for job descriptions...\n')

  // Get all jobs without descriptions
  const jobs = await prisma.job.findMany({
    where: {
      OR: [
        { description: null },
        { description: '' },
      ],
      isActive: true,
    },
    select: {
      id: true,
      url: true,
      source: true,
      title: true,
      company: true,
    },
    orderBy: { crawledAt: 'desc' },
    take: 100, // Process in batches of 100
  })

  console.log(`📦 Found ${jobs.length} jobs without descriptions\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    console.log(`[${i + 1}/${jobs.length}] ${job.title} at ${job.company}`)
    console.log(`  🔗 ${job.url}`)

    try {
      const details = await fetchJobDetailsFromUrl(job.url, job.source)

      if (details.description && details.description.length > 50) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            description: details.description,
            requirements: details.requirements || null,
            responsibilities: details.responsibilities || null,
            benefits: details.benefits || null,
            experienceLevel: details.experienceLevel || null,
            remoteType: details.remoteType || null,
            companyLogo: details.companyLogo || null,
            companyWebsite: details.companyWebsite || null,
            updatedAt: new Date(),
          },
        })
        console.log(`  ✅ Updated with ${details.description.length} chars description`)
        successCount++
      } else {
        console.log(`  ⚠️ No description found or too short`)
        failCount++
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error}`)
      failCount++
    }

    // Rate limiting: wait between requests
    await delay(500)
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Failed/No content: ${failCount}`)
  console.log(`${'═'.repeat(50)}`)

  await prisma.$disconnect()
}

// Run the script
recrawlDescriptions().catch(console.error)
