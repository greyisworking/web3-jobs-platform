import axios from 'axios'

async function checkGetroAPI() {
  const { data } = await axios.post(
    'https://api.getro.com/api/v2/collections/858/search/jobs',
    { hits_per_page: 5, page: 0, filters: '', query: '' },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    }
  )

  console.log('Total jobs:', data.results.count)
  console.log('\nSample jobs with fields:')

  data.results.jobs.slice(0, 5).forEach((job: any, i: number) => {
    console.log(`\n--- Job ${i+1} ---`)
    console.log('Title:', job.title)
    console.log('Company:', job.organization?.name)
    console.log('URL:', job.url?.slice(0, 80))
    console.log('Has description:', job.description ? 'YES' : 'NO')
    console.log('Description length:', job.description?.length || 0)
    if (job.description) {
      console.log('Description preview:', job.description.slice(0, 200))
    }
  })
}
checkGetroAPI().catch(console.error)
