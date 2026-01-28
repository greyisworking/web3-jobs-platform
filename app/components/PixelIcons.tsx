interface PixelIconProps {
  className?: string
  size?: number
}

function PixelGrid({ paths, size = 16, className = '' }: { paths: number[][]; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={className}
    >
      {paths.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  )
}

// 📍 Pin / Location
export function PixelPin({ className, size }: PixelIconProps) {
  const paths = [
    [3,0],[4,0],
    [2,1],[3,1],[4,1],[5,1],
    [2,2],[3,2],[4,2],[5,2],
    [2,3],[3,3],[4,3],[5,3],
    [3,4],[4,4],
    [3,5],[4,5],
    [3,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 💰 Coin
export function PixelCoin({ className, size }: PixelIconProps) {
  const paths = [
    [2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [1,2],[2,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [1,4],[2,4],[4,4],[5,4],[6,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    [2,6],[3,6],[4,6],[5,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 👤 Person
export function PixelPerson({ className, size }: PixelIconProps) {
  const paths = [
    [3,0],[4,0],
    [3,1],[4,1],
    [2,3],[3,3],[4,3],[5,3],
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    [2,6],[3,6],[4,6],[5,6],
    [2,7],[3,7],[4,7],[5,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// → Arrow
export function PixelArrow({ className, size }: PixelIconProps) {
  const paths = [
    [5,1],
    [6,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
    [6,5],
    [5,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// ⭐ Star
export function PixelStar({ className, size }: PixelIconProps) {
  const paths = [
    [3,0],[4,0],
    [3,1],[4,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [2,4],[3,4],[4,4],[5,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    [1,6],[2,6],[5,6],[6,6],
    [0,7],[1,7],[6,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🌿 Grass
export function PixelGrass({ className, size }: PixelIconProps) {
  const paths = [
    [1,0],[6,0],
    [1,1],[3,1],[5,1],[6,1],
    [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    [2,5],[3,5],[4,5],[5,5],
    [3,6],[4,6],
    [3,7],[4,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🔥 Fire
export function PixelFire({ className, size }: PixelIconProps) {
  const paths = [
    [3,0],[4,0],
    [2,1],[3,1],[4,1],[5,1],
    [2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    [2,6],[3,6],[4,6],[5,6],
    [3,7],[4,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// ✉️ Send
export function PixelSend({ className, size }: PixelIconProps) {
  const paths = [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
    [0,1],[1,1],[2,1],[5,1],[6,1],[7,1],
    [0,2],[2,2],[3,2],[4,2],[5,2],[7,2],
    [0,3],[3,3],[4,3],[7,3],
    [0,4],[2,4],[3,4],[4,4],[5,4],[7,4],
    [0,5],[1,5],[2,5],[5,5],[6,5],[7,5],
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// ══════════════════════════════════════════════════════════
// Trust Badge Icons (Pixelbara expressions)
// ══════════════════════════════════════════════════════════

// 👍 Thumbs Up (Verified)
export function PixelThumbsUp({ className, size }: PixelIconProps) {
  const paths = [
    [4,0],[5,0],
    [3,1],[4,1],[5,1],[6,1],
    [2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],
    [2,6],[3,6],[4,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🤔 Thinking (Caution)
export function PixelThinking({ className, size }: PixelIconProps) {
  const paths = [
    [2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [1,2],[2,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [2,4],[3,4],[4,4],[5,4],
    [3,5],[4,5],
    [1,6],[2,6],
    [0,7],[1,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 😰 Sweating (Warning)
export function PixelSweating({ className, size }: PixelIconProps) {
  const paths = [
    [2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [1,2],[2,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [2,4],[3,4],[4,4],[5,4],
    [3,5],[4,5],
    [7,2],
    [7,3],
    [7,4],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🏃 Running (Blacklisted)
export function PixelRunning({ className, size }: PixelIconProps) {
  const paths = [
    [4,0],[5,0],
    [4,1],[5,1],
    [2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],
    [3,4],[4,4],[5,4],[6,4],
    [2,5],[3,5],[5,5],[6,5],
    [1,6],[2,6],[6,6],[7,6],
    [0,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// ✓ Check mark
export function PixelCheck({ className, size }: PixelIconProps) {
  const paths = [
    [6,1],[7,1],
    [5,2],[6,2],
    [4,3],[5,3],
    [1,4],[3,4],[4,4],
    [1,5],[2,5],[3,5],
    [2,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// ✗ X mark
export function PixelX({ className, size }: PixelIconProps) {
  const paths = [
    [1,1],[2,1],[6,1],[7,1],
    [2,2],[3,2],[5,2],[6,2],
    [3,3],[4,3],[5,3],
    [3,4],[4,4],[5,4],
    [2,5],[3,5],[5,5],[6,5],
    [1,6],[2,6],[6,6],[7,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// ══════════════════════════════════════════════════════════
// Sector Icons
// ══════════════════════════════════════════════════════════

// 📊 Chart (DeFi)
export function PixelChart({ className, size }: PixelIconProps) {
  const paths = [
    [6,0],[7,0],
    [6,1],[7,1],
    [3,2],[4,2],[6,2],[7,2],
    [3,3],[4,3],[6,3],[7,3],
    [1,4],[2,4],[3,4],[4,4],[6,4],[7,4],
    [1,5],[2,5],[3,5],[4,5],[6,5],[7,5],
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
    [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🎮 Gaming
export function PixelGamepad({ className, size }: PixelIconProps) {
  const paths = [
    [2,1],[3,1],[4,1],[5,1],
    [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    [0,4],[1,4],[3,4],[4,4],[6,4],[7,4],
    [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],
    [1,6],[2,6],[5,6],[6,6],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🖼️ NFT
export function PixelNFT({ className, size }: PixelIconProps) {
  const paths = [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
    [0,1],[7,1],
    [0,2],[2,2],[3,2],[7,2],
    [0,3],[2,3],[3,3],[5,3],[7,3],
    [0,4],[4,4],[5,4],[7,4],
    [0,5],[7,5],
    [0,6],[7,6],
    [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🔗 Chain (L1/L2/Infra)
export function PixelChain({ className, size }: PixelIconProps) {
  const paths = [
    [2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[5,1],[6,1],
    [1,2],[2,2],[5,2],[6,2],
    [2,3],[3,3],[4,3],[5,3],
    [2,4],[3,4],[4,4],[5,4],
    [1,5],[2,5],[5,5],[6,5],
    [1,6],[2,6],[5,6],[6,6],
    [2,7],[3,7],[4,7],[5,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🏛️ DAO
export function PixelDAO({ className, size }: PixelIconProps) {
  const paths = [
    [3,0],[4,0],
    [2,1],[3,1],[4,1],[5,1],
    [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[5,3],[6,3],
    [1,4],[2,4],[5,4],[6,4],
    [1,5],[2,5],[5,5],[6,5],
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
    [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 💬 Social
export function PixelSocial({ className, size }: PixelIconProps) {
  const paths = [
    [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    [0,6],[1,6],
    [0,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 💎 Token
export function PixelToken({ className, size }: PixelIconProps) {
  const paths = [
    [2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [2,4],[3,4],[4,4],[5,4],
    [3,5],[4,5],
    [3,6],[4,6],
    [3,7],[4,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🔒 Lock (Security)
export function PixelLock({ className, size }: PixelIconProps) {
  const paths = [
    [2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[5,1],[6,1],
    [1,2],[2,2],[5,2],[6,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
    [0,5],[1,5],[3,5],[4,5],[6,5],[7,5],
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
    [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 📈 Trending Up
export function PixelTrendUp({ className, size }: PixelIconProps) {
  const paths = [
    [5,0],[6,0],[7,0],
    [5,1],[6,1],[7,1],
    [4,2],[5,2],[7,2],
    [3,3],[4,3],
    [2,4],[3,4],
    [1,5],[2,5],
    [0,6],[1,6],
    [0,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 📉 Trending Down
export function PixelTrendDown({ className, size }: PixelIconProps) {
  const paths = [
    [0,0],
    [0,1],[1,1],
    [1,2],[2,2],
    [2,3],[3,3],
    [3,4],[4,4],
    [4,5],[5,5],[7,5],
    [5,6],[6,6],[7,6],
    [5,7],[6,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}

// 🔗 LinkedIn
export function PixelLinkedIn({ className, size }: PixelIconProps) {
  const paths = [
    [1,0],[2,0],
    [1,1],[2,1],
    [1,3],[2,3],[4,3],[5,3],[6,3],
    [1,4],[2,4],[4,4],[5,4],[6,4],[7,4],
    [1,5],[2,5],[4,5],[5,5],[7,5],
    [1,6],[2,6],[4,6],[5,6],[7,6],
    [1,7],[2,7],[4,7],[5,7],[7,7],
  ]
  return <PixelGrid paths={paths} size={size} className={className} />
}
