'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import Footer from '../components/Footer'
import Image from 'next/image'
import { Camera, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ResumeSection from '../components/ResumeSection'

interface Profile {
  id: string
  full_name: string | null
  headline: string | null
  bio: string | null
  location: string | null
  website: string | null
  twitter: string | null
  github: string | null
  linkedin: string | null
  skills: string[]
  avatar_url: string | null
  is_open_to_work: boolean
  preferred_roles: string[]
  preferred_locations: string[]
}

const DEFAULT_PROFILE: Omit<Profile, 'id'> = {
  full_name: null,
  headline: null,
  bio: null,
  location: null,
  website: null,
  twitter: null,
  github: null,
  linkedin: null,
  skills: [],
  avatar_url: null,
  is_open_to_work: false,
  preferred_roles: [],
  preferred_locations: [],
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch profile from API or use defaults
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(data.profile || { id: user.id, ...DEFAULT_PROFILE })
        } else {
          setProfile({ id: user.id, ...DEFAULT_PROFILE })
        }
      } catch {
        setProfile({ id: user.id, ...DEFAULT_PROFILE })
      }
      setLoading(false)
    }
    init()
  }, [router, supabase.auth])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        toast.success('Profile saved successfully')
      } else {
        toast.error('Failed to save profile')
      }
    } catch {
      toast.error('Failed to save profile')
    }
    setSaving(false)
  }

  const addSkill = () => {
    if (!skillInput.trim() || !profile) return
    const skill = skillInput.trim()
    if (!profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    if (!profile) return
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            <div className="w-6 h-6 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-3">
            Profile
          </h1>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto" />
        </div>

        {/* Avatar */}
        <section className="mb-12 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
              {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                <Image
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-a24-muted dark:text-a24-dark-muted">
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-full hover:bg-a24-bg dark:hover:bg-a24-dark-bg transition-colors">
              <Camera size={14} className="text-a24-muted dark:text-a24-dark-muted" />
            </button>
          </div>
        </section>

        {/* Basic Info */}
        <section className="mb-12">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Basic Info
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Full Name
              </label>
              <input
                type="text"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile(p => p ? { ...p, full_name: e.target.value } : p)}
                placeholder="Your full name"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Headline
              </label>
              <input
                type="text"
                value={profile?.headline || ''}
                onChange={(e) => setProfile(p => p ? { ...p, headline: e.target.value } : p)}
                placeholder="e.g., Senior Smart Contract Developer"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Bio
              </label>
              <textarea
                value={profile?.bio || ''}
                onChange={(e) => setProfile(p => p ? { ...p, bio: e.target.value } : p)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Location
              </label>
              <input
                type="text"
                value={profile?.location || ''}
                onChange={(e) => setProfile(p => p ? { ...p, location: e.target.value } : p)}
                placeholder="e.g., Seoul, Korea"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Skills
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.25em] bg-neun-success hover:bg-neun-success/90 text-white transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile?.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] uppercase tracking-[0.15em] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-a24-muted dark:text-a24-dark-muted hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Resume */}
        <ResumeSection />

        {/* Social Links */}
        <section className="mb-12">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Links
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Website
              </label>
              <input
                type="url"
                value={profile?.website || ''}
                onChange={(e) => setProfile(p => p ? { ...p, website: e.target.value } : p)}
                placeholder="https://yoursite.com"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                GitHub
              </label>
              <input
                type="text"
                value={profile?.github || ''}
                onChange={(e) => setProfile(p => p ? { ...p, github: e.target.value } : p)}
                placeholder="username"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Twitter / X
              </label>
              <input
                type="text"
                value={profile?.twitter || ''}
                onChange={(e) => setProfile(p => p ? { ...p, twitter: e.target.value } : p)}
                placeholder="username"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                LinkedIn
              </label>
              <input
                type="text"
                value={profile?.linkedin || ''}
                onChange={(e) => setProfile(p => p ? { ...p, linkedin: e.target.value } : p)}
                placeholder="username"
                className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-neun-success focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Job Preferences */}
        <section className="mb-12">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Job Preferences
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile?.is_open_to_work || false}
              onChange={(e) => setProfile(p => p ? { ...p, is_open_to_work: e.target.checked } : p)}
              className="w-4 h-4 accent-neun-success"
            />
            <span className="text-sm text-a24-text dark:text-a24-dark-text">
              Open to work - Recruiters can see you&apos;re actively looking
            </span>
          </label>
        </section>

        {/* Save Button */}
        <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-[0.3em] bg-neun-success hover:bg-neun-success/90 disabled:bg-neun-success/50 text-white transition-colors"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Profile
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
