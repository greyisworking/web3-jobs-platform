import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/careers/${id}`)
}
