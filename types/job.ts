export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  category: string
  url: string
  salary: string | null
  source: string
  region: string
  postedDate: Date | null
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
  description?: string | null
  tags?: string | null
}
