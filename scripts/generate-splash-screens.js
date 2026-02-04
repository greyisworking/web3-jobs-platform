const fs = require('fs')
const path = require('path')

// iOS Splash Screen sizes (portrait)
const splashScreens = [
  // iPhone
  { width: 1170, height: 2532, name: 'iphone-12-pro' },        // iPhone 12/13/14 Pro
  { width: 1179, height: 2556, name: 'iphone-14-pro' },        // iPhone 14 Pro
  { width: 1284, height: 2778, name: 'iphone-12-pro-max' },    // iPhone 12/13/14 Pro Max
  { width: 1290, height: 2796, name: 'iphone-14-pro-max' },    // iPhone 14 Pro Max
  { width: 1125, height: 2436, name: 'iphone-x' },             // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'iphone-xs-max' },        // iPhone XS Max/11 Pro Max
  { width: 828, height: 1792, name: 'iphone-xr' },             // iPhone XR/11
  { width: 750, height: 1334, name: 'iphone-8' },              // iPhone 6/7/8/SE2/SE3
  { width: 640, height: 1136, name: 'iphone-se' },             // iPhone SE (1st)
  // iPad
  { width: 1668, height: 2388, name: 'ipad-pro-11' },          // iPad Pro 11"
  { width: 2048, height: 2732, name: 'ipad-pro-12' },          // iPad Pro 12.9"
  { width: 1620, height: 2160, name: 'ipad-10' },              // iPad 10th gen
  { width: 1536, height: 2048, name: 'ipad-air' },             // iPad Air/Mini
]

// Generate SVG splash screen
function generateSplashSVG(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F172A"/>
      <stop offset="100%" style="stop-color:#1E293B"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <text x="50%" y="45%" text-anchor="middle" fill="#22C55E" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(width * 0.08)}" font-weight="700">NEUN</text>
  <text x="50%" y="52%" text-anchor="middle" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(width * 0.025)}">Web3 Careers</text>
</svg>`
}

// Create splash screens directory
const splashDir = path.join(__dirname, '../public/splash')
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true })
}

// Generate all splash screens
splashScreens.forEach(({ width, height, name }) => {
  const svg = generateSplashSVG(width, height)
  const filePath = path.join(splashDir, `splash-${name}.svg`)
  fs.writeFileSync(filePath, svg)
  console.log(`Generated: splash-${name}.svg (${width}x${height})`)
})

console.log('\nDone! Add the following to your layout.tsx <head>:')
console.log('\n// See app/layout.tsx for apple-touch-startup-image links')
