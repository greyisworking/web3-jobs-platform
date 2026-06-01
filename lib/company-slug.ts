import { PRIORITY_COMPANIES, type PriorityCompany } from './priority-companies'

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function findCompanyBySlug(slug: string): PriorityCompany | undefined {
  return PRIORITY_COMPANIES.find(c => toSlug(c.name) === slug)
}
