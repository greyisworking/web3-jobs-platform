import { createSupabaseServerClient } from './supabase-server'

export async function getAdminUser() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('id', user.id)
    .single()

  if (adminError || !admin) {
    throw new Error('Not authorized as admin')
  }

  return { user, admin }
}
