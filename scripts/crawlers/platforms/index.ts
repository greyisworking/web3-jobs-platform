export interface PlatformJob {
  title: string
  company: string
  url: string
  applyUrl?: string   // Direct apply URL if different from job URL
  location: string
  type: string
  category: string
  tags: string[]
  postedDate: Date
  description?: string  // Job description HTML/text
  salary?: string       // Salary/compensation info
}

export { crawlLeverJobs } from './lever'
export { crawlGreenhouseJobs } from './greenhouse'
export { crawlAshbyJobs } from './ashby'
export { crawlGetroBoard } from './getro'
export type { GetroConfig, CrawlerReturn } from './getro'
