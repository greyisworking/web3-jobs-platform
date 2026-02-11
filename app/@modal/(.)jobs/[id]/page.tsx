import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Job } from '@/types/job'
import JobModal from './JobModal'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getJob(id: string): Promise<Job | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('Job')
    .select('*')
    .eq('id', id)
    .eq('isActive', true)
    .single()

  if (error || !data) return null
  return data as Job
}

export default async function InterceptedJobPage({ params }: PageProps) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  return <JobModal job={job} />
}
