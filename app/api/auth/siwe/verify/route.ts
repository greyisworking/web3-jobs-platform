import { NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  try {
    const { message, signature } = await request.json()

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      )
    }

    // Get nonce from cookie
    const cookieStore = await cookies()
    const savedNonce = cookieStore.get('siwe-nonce')?.value

    if (!savedNonce) {
      return NextResponse.json(
        { error: 'Nonce expired. Please try again.' },
        { status: 400 }
      )
    }

    // Verify SIWE message
    const siweMessage = new SiweMessage(message)
    const { data: fields } = await siweMessage.verify({ signature, nonce: savedNonce })

    const walletAddress = fields.address.toLowerCase()

    // Check if user exists with this wallet address
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.user_metadata?.wallet_address === walletAddress
    )

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new user with wallet address
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: `${walletAddress}@wallet.neun.wtf`,
        email_confirm: true,
        user_metadata: {
          wallet_address: walletAddress,
          provider: 'siwe',
        },
      })

      if (createError || !newUser.user) {
        console.error('[SIWE] Failed to create user:', createError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }

      userId = newUser.user.id
    }

    // Generate a magic link to create a session
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${walletAddress}@wallet.neun.wtf`,
      options: {
        redirectTo: origin,
      },
    })

    if (linkError || !linkData) {
      console.error('[SIWE] Failed to generate link:', linkError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Exchange the token_hash for a session
    const response = NextResponse.json({ success: true })

    // Clear the nonce cookie
    response.cookies.delete('siwe-nonce')

    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
                response.cookies.set(name, value, options)
              })
            } catch (e) {
              // Ignore in server component context
            }
          },
        },
      }
    )

    // Use the OTP from the magic link to verify and create session
    const tokenHash = linkData.properties?.hashed_token
    if (tokenHash) {
      const { error: verifyError } = await supabaseServer.auth.verifyOtp({
        type: 'magiclink',
        token_hash: tokenHash,
      })

      if (verifyError) {
        console.error('[SIWE] Session verification error:', verifyError)
        return NextResponse.json(
          { error: 'Failed to verify session' },
          { status: 500 }
        )
      }
    }

    return response
  } catch (error) {
    console.error('[SIWE] Verification error:', error)

    const message = error instanceof Error ? error.message : 'Verification failed'

    if (message.includes('Signature does not match') || message.includes('Invalid')) {
      return NextResponse.json(
        { error: 'Invalid signature. Please try again.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
