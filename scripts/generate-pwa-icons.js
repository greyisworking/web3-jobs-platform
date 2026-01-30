/**
 * PWA Icon Generator - Creates pixel art Pixelbara icons
 * Run with: node scripts/generate-pwa-icons.js
 */

const fs = require('fs')
const path = require('path')

// Pixel art data for Pixelbara face (16x16 grid)
// Colors: . = transparent, B = brown, D = dark brown, E = eye (black), N = nose, W = white, G = green
const PIXELBARA_FACE = `
................
.....BBBBBB.....
....BBBBBBBB....
...BBBBBBBBBB...
..BBBBBBBBBBBB..
..BBBBEEBBEEBB..
..BBBBEEBBBBBB..
..BBBBBBBBBBBB..
...BBBNNNBBB....
....BBBBBBB.....
.....BBBBB......
................
`

const COLORS = {
  '.': 'transparent',
  'B': '#8B7355', // Brown - capybara color
  'D': '#6B5344', // Dark brown
  'E': '#1A1A1A', // Eye black
  'N': '#4A3728', // Nose dark
  'W': '#FFFFFF', // White
  'G': '#22C55E', // Green accent
}

// Generate SVG icon
function generateSVG(size, withBackground = true) {
  const pixelSize = size / 16
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`

  // Background
  if (withBackground) {
    svg += `<rect width="${size}" height="${size}" fill="#0F172A"/>`
    // Green accent border
    svg += `<rect x="2" y="2" width="${size-4}" height="${size-4}" fill="none" stroke="#22C55E" stroke-width="2"/>`
  }

  // Parse pixel art
  const rows = PIXELBARA_FACE.trim().split('\n')
  rows.forEach((row, y) => {
    const chars = row.split('')
    chars.forEach((char, x) => {
      const color = COLORS[char]
      if (color && color !== 'transparent') {
        svg += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`
      }
    })
  })

  svg += '</svg>'
  return svg
}

// More detailed Pixelbara icon with full body for larger sizes
function generateDetailedSVG(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <!-- Background -->
  <rect width="64" height="64" fill="#0F172A"/>

  <!-- Green accent ring -->
  <rect x="4" y="4" width="56" height="56" rx="8" fill="none" stroke="#22C55E" stroke-width="3"/>

  <!-- Pixelbara body -->
  <g transform="translate(12, 14)">
    <!-- Body -->
    <rect x="4" y="20" width="32" height="16" fill="#8B7355"/>
    <rect x="8" y="18" width="24" height="4" fill="#8B7355"/>
    <rect x="6" y="36" width="4" height="6" fill="#6B5344"/>
    <rect x="30" y="36" width="4" height="6" fill="#6B5344"/>

    <!-- Head -->
    <rect x="8" y="4" width="24" height="18" fill="#8B7355"/>
    <rect x="6" y="6" width="4" height="14" fill="#8B7355"/>
    <rect x="30" y="6" width="4" height="14" fill="#8B7355"/>

    <!-- Ears -->
    <rect x="6" y="2" width="6" height="6" fill="#8B7355"/>
    <rect x="28" y="2" width="6" height="6" fill="#8B7355"/>
    <rect x="8" y="4" width="2" height="2" fill="#6B5344"/>
    <rect x="30" y="4" width="2" height="2" fill="#6B5344"/>

    <!-- Eyes -->
    <rect x="12" y="10" width="4" height="4" fill="#1A1A1A"/>
    <rect x="24" y="10" width="4" height="4" fill="#1A1A1A"/>
    <rect x="13" y="11" width="2" height="2" fill="#FFFFFF"/>
    <rect x="25" y="11" width="2" height="2" fill="#FFFFFF"/>

    <!-- Nose -->
    <rect x="18" y="16" width="4" height="3" fill="#4A3728"/>
  </g>
</svg>`
  return svg
}

// Maskable icon (with safe zone padding)
function generateMaskableSVG(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Full background for maskable -->
  <rect width="${size}" height="${size}" fill="#0F172A"/>

  <!-- Centered content in safe zone (inner 80%) -->
  <g transform="translate(${size * 0.1}, ${size * 0.1}) scale(0.8)">
    <!-- Green ring -->
    <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}" rx="${size * 0.1}" fill="none" stroke="#22C55E" stroke-width="${size * 0.04}"/>

    <!-- Simple Pixelbara face -->
    <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size / 100})">
      <!-- Head -->
      <rect x="10" y="5" width="40" height="35" fill="#8B7355"/>

      <!-- Ears -->
      <rect x="8" y="0" width="10" height="10" fill="#8B7355"/>
      <rect x="42" y="0" width="10" height="10" fill="#8B7355"/>
      <rect x="10" y="2" width="6" height="6" fill="#6B5344"/>
      <rect x="44" y="2" width="6" height="6" fill="#6B5344"/>

      <!-- Eyes -->
      <rect x="18" y="15" width="8" height="8" fill="#1A1A1A"/>
      <rect x="34" y="15" width="8" height="8" fill="#1A1A1A"/>
      <rect x="20" y="17" width="4" height="4" fill="#FFFFFF"/>
      <rect x="36" y="17" width="4" height="4" fill="#FFFFFF"/>

      <!-- Nose -->
      <rect x="26" y="28" width="8" height="6" fill="#4A3728"/>
    </g>
  </g>
</svg>`
  return svg
}

// Badge icon (simple, high contrast)
function generateBadgeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#22C55E"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#0F172A" font-family="monospace" font-weight="bold" font-size="${size * 0.5}">N</text>
</svg>`
}

// Shortcut icons
function generateShortcutSVG(icon, size) {
  const icons = {
    jobs: `<path d="M20 6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H4V8h16v12zM6 10h12v2H6zm0 4h8v2H6z" fill="#22C55E"/>`,
    post: `<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#22C55E"/>`,
    companies: `<path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#22C55E"/>`,
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#0F172A"/>
  ${icons[icon] || icons.jobs}
</svg>`
}

// Main function
async function main() {
  const publicDir = path.join(__dirname, '../public')
  const iconsDir = path.join(publicDir, 'icons')

  // Ensure directories exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

  console.log('Generating PWA icons...')

  // Generate regular icons
  for (const size of sizes) {
    const svg = size >= 192 ? generateDetailedSVG(size) : generateSVG(size)
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg)
    console.log(`  Created icon-${size}x${size}.svg`)
  }

  // Generate maskable icons
  for (const size of [192, 512]) {
    const svg = generateMaskableSVG(size)
    fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.svg`), svg)
    console.log(`  Created icon-maskable-${size}x${size}.svg`)
  }

  // Generate badge icon
  fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), generateBadgeSVG(72))
  console.log('  Created badge-72x72.svg')

  // Generate shortcut icons
  for (const shortcut of ['jobs', 'post', 'companies']) {
    fs.writeFileSync(path.join(iconsDir, `shortcut-${shortcut}.svg`), generateShortcutSVG(shortcut, 96))
    console.log(`  Created shortcut-${shortcut}.svg`)
  }

  console.log('\nDone! SVG icons created.')
  console.log('\nNote: For production, convert SVGs to PNGs using:')
  console.log('  - Online: https://cloudconvert.com/svg-to-png')
  console.log('  - CLI: npx sharp-cli (or imagemagick)')
  console.log('\nUpdate manifest.json to use .svg instead of .png if keeping SVGs.')
}

main().catch(console.error)
