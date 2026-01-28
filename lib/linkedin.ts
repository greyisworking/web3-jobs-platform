/**
 * LinkedIn URL Generator
 * Creates deep links to LinkedIn job search with pre-filled parameters
 */

const LINKEDIN_JOBS_BASE = 'https://www.linkedin.com/jobs/search/'

interface LinkedInSearchParams {
  company?: string
  title?: string
  location?: string
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'temporary' | 'internship'
  remote?: boolean
}

// Experience level mapping
const EXPERIENCE_LEVELS: Record<string, string> = {
  entry: '2',      // Entry level
  mid: '3',        // Associate
  senior: '4',     // Mid-Senior level
  executive: '5',  // Director
}

// Job type mapping
const JOB_TYPES: Record<string, string> = {
  fulltime: 'F',
  parttime: 'P',
  contract: 'C',
  temporary: 'T',
  internship: 'I',
}

// Location ID mapping for common Web3 hubs
const LOCATION_IDS: Record<string, string> = {
  'seoul': '105149562',
  'korea': '105149562',
  'south korea': '105149562',
  'singapore': '102454443',
  'san francisco': '102277331',
  'new york': '105080838',
  'london': '102257491',
  'tokyo': '102257019',
  'berlin': '106967730',
  'dubai': '104305776',
  'hong kong': '102890883',
  'remote': '', // No location filter for remote
}

/**
 * Generate LinkedIn job search URL
 */
export function generateLinkedInSearchURL(params: LinkedInSearchParams): string {
  const searchParams = new URLSearchParams()

  // Keywords (company + title)
  const keywords: string[] = []
  if (params.company) keywords.push(params.company)
  if (params.title) keywords.push(params.title)
  if (keywords.length > 0) {
    searchParams.set('keywords', keywords.join(' '))
  }

  // Location
  if (params.location && !params.remote) {
    const locationLower = params.location.toLowerCase()
    for (const [key, id] of Object.entries(LOCATION_IDS)) {
      if (locationLower.includes(key) && id) {
        searchParams.set('location', params.location)
        searchParams.set('geoId', id)
        break
      }
    }
    // Fallback to just the location string if no ID found
    if (!searchParams.has('location')) {
      searchParams.set('location', params.location)
    }
  }

  // Remote filter
  if (params.remote) {
    searchParams.set('f_WT', '2') // Remote work type
  }

  // Experience level
  if (params.experienceLevel) {
    const level = EXPERIENCE_LEVELS[params.experienceLevel]
    if (level) {
      searchParams.set('f_E', level)
    }
  }

  // Job type
  if (params.jobType) {
    const type = JOB_TYPES[params.jobType]
    if (type) {
      searchParams.set('f_JT', type)
    }
  }

  return `${LINKEDIN_JOBS_BASE}?${searchParams.toString()}`
}

/**
 * Generate LinkedIn URL for a specific job posting
 */
export function generateLinkedInJobURL(company: string, title: string, location?: string): string {
  const isRemote = location?.toLowerCase().includes('remote')

  return generateLinkedInSearchURL({
    company,
    title,
    location: isRemote ? undefined : location,
    remote: isRemote,
  })
}

/**
 * Generate LinkedIn company page URL (if known)
 */
export function generateLinkedInCompanyURL(company: string): string {
  // Normalize company name for URL
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `https://www.linkedin.com/company/${slug}`
}

/**
 * Get job type filter options
 */
export function getJobTypeOptions() {
  return [
    { value: 'fulltime', label: 'Full-time' },
    { value: 'parttime', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ]
}

/**
 * Get experience level options
 */
export function getExperienceLevelOptions() {
  return [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Associate' },
    { value: 'senior', label: 'Mid-Senior' },
    { value: 'executive', label: 'Director+' },
  ]
}

/**
 * Common Web3 hub locations
 */
export function getLocationOptions() {
  return [
    { value: 'seoul', label: 'Seoul, Korea' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'san francisco', label: 'San Francisco, USA' },
    { value: 'new york', label: 'New York, USA' },
    { value: 'london', label: 'London, UK' },
    { value: 'tokyo', label: 'Tokyo, Japan' },
    { value: 'berlin', label: 'Berlin, Germany' },
    { value: 'dubai', label: 'Dubai, UAE' },
    { value: 'remote', label: 'Remote' },
  ]
}
