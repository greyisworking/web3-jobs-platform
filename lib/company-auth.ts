import { createSupabaseServerClient } from './supabase-server'

export interface Company {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  website: string | null
  description: string | null
  industry: string | null
  size: string | null
  location: string | null
  founded_year: number | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export async function getCompanyUser() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (companyError || !company) {
    throw new Error('No company profile found')
  }

  return { user, company: company as Company }
}

export async function getOrCreateCompany(userId: string, email: string) {
  const supabase = await createSupabaseServerClient()

  // Check if company exists
  const { data: existing } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing as Company
  }

  // Create new company profile
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      name: email.split('@')[0], // Default name from email
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create company profile')
  }

  return newCompany as Company
}
