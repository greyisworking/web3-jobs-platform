import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  Plus
} from 'lucide-react'

async function getCompanyData() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { user, company }
}

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const data = await getCompanyData()

  if (!data) {
    redirect('/company/login')
  }

  const { user, company } = data

  // If no company profile, create one
  if (!company) {
    const supabase = await createSupabaseServerClient()
    await supabase.from('companies').insert({
      user_id: user.id,
      name: user.email?.split('@')[0] || 'My Company',
    })
  }

  const navItems = [
    { href: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/company/dashboard/jobs', icon: Briefcase, label: 'My Jobs' },
    { href: '/company/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/company/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="text-xl font-bold text-white">
            NEUN
          </Link>
          <p className="text-xs text-gray-500 mt-1">Company Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}

          {/* Post Job CTA */}
          <Link
            href="/company/dashboard/jobs/new"
            className="flex items-center gap-3 px-4 py-3 mt-4 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Post New Job</span>
          </Link>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {company?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {company?.name || 'Company'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <form action="/api/company/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800/50 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
