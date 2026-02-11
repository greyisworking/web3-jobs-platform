export interface PlatformJob {
  title: string
  company: string
  url: string
  location: string
  type: string
  category: string
  tags: string[]
  postedDate: Date
  description?: string  // Job description HTML/text
}

export { crawlLeverJobs } from './lever'
export { crawlGreenhouseJobs } from './greenhouse'
export { crawlAshbyJobs } from './ashby'
export { crawlGetroBoard } from './getro'
export type { GetroConfig, CrawlerReturn } from './getro'
