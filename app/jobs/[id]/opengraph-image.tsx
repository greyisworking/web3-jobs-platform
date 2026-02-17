import { ImageResponse } from 'next/og'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'edge'
export const alt = 'NEUN - Web3 Jobs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: job } = await supabase
    .from('Job')
    .select('title, company, location, type, salary, backers')
    .eq('id', params.id)
    .single()

  if (!job) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            fontFamily: 'system-ui',
          }}
        >
          <div style={{ color: '#22C55E', fontSize: 48, fontWeight: 700 }}>NEUN</div>
          <div style={{ color: '#666', fontSize: 24, marginTop: 16 }}>Job Not Found</div>
        </div>
      ),
      { ...size }
    )
  }

  const backers = Array.isArray(job.backers) ? job.backers.slice(0, 3) : []

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui',
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              color: '#22C55E',
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          >
            NEUN
          </div>
          <div
            style={{
              color: '#666',
              fontSize: 20,
              marginLeft: 16,
              letterSpacing: '0.05em',
            }}
          >
            WEB3 JOBS
          </div>
        </div>

        {/* Job Title */}
        <div
          style={{
            color: '#fff',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 24,
          }}
        >
          {job.title.length > 50 ? job.title.slice(0, 50) + '...' : job.title}
        </div>

        {/* Company */}
        <div
          style={{
            color: '#22C55E',
            fontSize: 36,
            fontWeight: 600,
            marginBottom: 32,
          }}
        >
          {job.company}
        </div>

        {/* Details Row */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
          {job.location && (
            <div style={{ display: 'flex', alignItems: 'center', color: '#888' }}>
              <span style={{ fontSize: 24 }}>{job.location}</span>
            </div>
          )}
          {job.type && (
            <div style={{ display: 'flex', alignItems: 'center', color: '#888' }}>
              <span style={{ fontSize: 24 }}>{job.type}</span>
            </div>
          )}
          {job.salary && (
            <div style={{ display: 'flex', alignItems: 'center', color: '#22C55E' }}>
              <span style={{ fontSize: 24 }}>{job.salary}</span>
            </div>
          )}
        </div>

        {/* Backers */}
        {backers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
            <span style={{ color: '#666', fontSize: 18, marginRight: 12 }}>Backed by</span>
            {backers.map((backer, i) => (
              <span
                key={i}
                style={{
                  color: '#fff',
                  fontSize: 18,
                  backgroundColor: '#1a1a1a',
                  padding: '8px 16px',
                  marginRight: 8,
                  borderRadius: 4,
                }}
              >
                {backer}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 60,
            color: '#444',
            fontSize: 18,
          }}
        >
          neun.wtf
        </div>
      </div>
    ),
    { ...size }
  )
}
