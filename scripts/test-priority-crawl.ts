import 'dotenv/config'
import { crawlPriorityCompanies } from './crawlers/priority-companies'

async function main() {
  console.log('Testing priority companies crawler...\n')
  const count = await crawlPriorityCompanies()
  console.log(`\n✅ Total: ${count} jobs saved`)
}

main().catch(console.error)
