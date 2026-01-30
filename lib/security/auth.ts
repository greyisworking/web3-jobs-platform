import { createClient } from '@supabase/supabase-js'
import { verifyMessage } from 'viem'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ════════════════════════════════════════════════════════════════════════════
// Nonce Management for Wallet Signature Verification
// ════════════════════════════════════════════════════════════════════════════

const NONCE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a unique nonce for wallet signature verification
 */
export async function generateNonce(wallet: string): Promise<string> {
  const normalizedWallet = wallet.toLowerCase()
  const nonce = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MS).toISOString()

  // Store nonce in database
  await supabase
    .from('auth_nonces')
    .upsert({
      wallet: normalizedWallet,
      nonce,
      expires_at: expiresAt,
      used: false,
    }, {
      onConflict: 'wallet'
    })

  return nonce
}

/**
 * Create a message for wallet signing
 */
export function createSignMessage(nonce: string, action: string = 'authenticate'): string {
  return `NEUN Verification\n\nAction: ${action}\nNonce: ${nonce}\n\nSign this message to verify you own this wallet.`
}

/**
 * Verify a wallet signature with nonce
 */
export async function verifyWalletSignature(
  wallet: string,
  signature: `0x${string}`,
  action: string = 'authenticate'
): Promise<{ valid: boolean; error?: string }> {
  const normalizedWallet = wallet.toLowerCase() as `0x${string}`

  try {
    // Get stored nonce
    const { data: nonceRecord, error: nonceError } = await supabase
      .from('auth_nonces')
      .select('*')
      .eq('wallet', normalizedWallet)
      .single()

    if (nonceError || !nonceRecord) {
      return { valid: false, error: 'No authentication nonce found. Please request a new one.' }
    }

    // Check if nonce is expired
    if (new Date(nonceRecord.expires_at) < new Date()) {
      return { valid: false, error: 'Nonce expired. Please request a new one.' }
    }

    // Check if nonce was already used
    if (nonceRecord.used) {
      return { valid: false, error: 'Nonce already used. Please request a new one.' }
    }

    // Verify signature
    const message = createSignMessage(nonceRecord.nonce, action)
    const isValid = await verifyMessage({
      address: normalizedWallet,
      message,
      signature,
    })

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' }
    }

    // Mark nonce as used
    await supabase
      .from('auth_nonces')
      .update({ used: true })
      .eq('wallet', normalizedWallet)

    return { valid: true }
  } catch (err) {
    console.error('Signature verification error:', err)
    return { valid: false, error: 'Verification failed' }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Session Token Management
// ════════════════════════════════════════════════════════════════════════════

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Create a session token after successful wallet verification
 */
export async function createSessionToken(wallet: string): Promise<string | null> {
  const normalizedWallet = wallet.toLowerCase()
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS).toISOString()

  const { error } = await supabase
    .from('wallet_sessions')
    .upsert({
      wallet: normalizedWallet,
      token,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'wallet'
    })

  if (error) {
    console.error('Session creation error:', error)
    return null
  }

  return token
}

/**
 * Verify a session token
 */
export async function verifySessionToken(
  wallet: string,
  token: string
): Promise<{ valid: boolean; error?: string }> {
  const normalizedWallet = wallet.toLowerCase()

  const { data: session, error } = await supabase
    .from('wallet_sessions')
    .select('*')
    .eq('wallet', normalizedWallet)
    .eq('token', token)
    .single()

  if (error || !session) {
    return { valid: false, error: 'Invalid session' }
  }

  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, error: 'Session expired. Please sign in again.' }
  }

  return { valid: true }
}

/**
 * Invalidate a session
 */
export async function invalidateSession(wallet: string): Promise<void> {
  const normalizedWallet = wallet.toLowerCase()
  await supabase
    .from('wallet_sessions')
    .delete()
    .eq('wallet', normalizedWallet)
}

// ════════════════════════════════════════════════════════════════════════════
// Wallet Validation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Normalize wallet address
 */
export function normalizeWallet(address: string): string {
  return address.toLowerCase()
}
