export interface PlatformJob {
  title: string
  company: string
  url: string
  location: string
  type: string
  category: string
  tags: string[]
  postedDate: Date
}

export { crawlLeverJobs } from './lever'
export { crawlGreenhouseJobs } from './greenhouse'
export { crawlAshbyJobs } from './ashby'
export { crawlWantedJobs } from './wanted'
export { crawlNotionJobs } from './notion'
