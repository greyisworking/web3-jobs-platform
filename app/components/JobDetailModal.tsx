'use client'

import type { Job } from '@/types/job'

interface JobDetailModalProps {
  job: Job | null
  onClose: () => void
}

/** Modal removed — cards now link directly to job URLs */
export default function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  return null
}
