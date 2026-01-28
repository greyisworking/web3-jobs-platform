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
