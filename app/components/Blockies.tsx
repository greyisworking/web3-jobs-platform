'use client'

// Deterministic blockies-style avatar based on wallet address
// Each address generates a unique 8x8 pixel pattern

interface BlockiesProps {
  address: string
  size?: number
  className?: string
}

function generateColors(address: string): [string, string, string] {
  // Use address to generate deterministic colors
  const hash = address.toLowerCase().replace('0x', '')

  const hue1 = parseInt(hash.slice(0, 4), 16) % 360
  const hue2 = (hue1 + 120) % 360
  const hue3 = (hue1 + 240) % 360

  return [
    `hsl(${hue1}, 70%, 60%)`,
    `hsl(${hue2}, 70%, 50%)`,
    `hsl(${hue3}, 70%, 40%)`,
  ]
}

function generatePattern(address: string): number[][] {
  const hash = address.toLowerCase().replace('0x', '')
  const pattern: number[][] = []

  // Generate 8x4 pattern (will be mirrored)
  for (let y = 0; y < 8; y++) {
    const row: number[] = []
    for (let x = 0; x < 4; x++) {
      const idx = (y * 4 + x) * 2
      const byte = parseInt(hash.slice(idx % 40, (idx % 40) + 2) || '00', 16)
      row.push(byte % 3) // 0, 1, or 2 for 3 colors
    }
    // Mirror horizontally
    pattern.push([...row, ...row.slice().reverse()])
  }

  return pattern
}

export default function Blockies({ address, size = 40, className = '' }: BlockiesProps) {
  if (!address || address.length < 10) {
    // Fallback for invalid address
    return (
      <div
        className={`bg-gray-600 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  const colors = generateColors(address)
  const pattern = generatePattern(address)
  const pixelSize = size / 8

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      {pattern.map((row, y) =>
        row.map((colorIdx, x) => (
          <rect
            key={`${x}-${y}`}
            x={x * pixelSize}
            y={y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill={colors[colorIdx]}
          />
        ))
      )}
    </svg>
  )
}

// Utility to truncate address
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
