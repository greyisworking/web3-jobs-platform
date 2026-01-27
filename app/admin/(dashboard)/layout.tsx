import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import { Sidebar } from '@/components/admin/sidebar'
import { AdminTopBar } from '../top-bar'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let admin
  try {
    admin = await getAdminUser()
  } catch {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AdminTopBar email={admin.user.email ?? ''} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
