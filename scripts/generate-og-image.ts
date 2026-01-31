/**
 * Generate OG Image for NEUN
 * Creates a 1200x630 PNG with Pixelbara + NEUN logo + slogan
 */

import puppeteer from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

const OG_WIDTH = 1200
const OG_HEIGHT = 630

// Pixelbara pixel art (simplified for OG image)
const PIXELBARA_ART = `
..............EeeE..........EeeE..............
.............EeiiE..........EeiiE.............
.............EEEE............EEEE.............
............FFFFFFFFFFFFFFFFFFFFFFff..........
...........FFFFFFFFFFFFFFFFFFFFFFFfff.........
..........FFFFFFFFFFFFFFFFFFFFFFFFffff........
.........FFFFFFFFFFFFFFFFFFFFFFFFFfffff.......
........FFFFFFFFFFFFFFFFFFFFFFFFFFFFffff......
........FFFFFFFFFFFFFFFFFFFFFFFFFFFFFfff......
........FFFFFFnnnnnnnFFFFFFnnnnnnnFFFfff......
........BFFFFFFFFFFFFFFFFFFFFFFFFFFFBfff......
........BFFFFFFFFFFFFFFFFFFFFFFFFFFBffff......
.........FFFFFFFFFoooNNNNNoooFFFFFFFffff......
.........FFFFFFFFoNNNNOONNNNoFFFFFFfffff......
.........FFFFFFFFFoNNNNNNNNoFFFFFFFfffff......
..........FFFFFFFFFooooooooFFFFFFFffffff......
..........FFFFFFFFFFFFmmFFFFFFFFFFFfffff......
...........FFFFFFFFFFFFFFFFFFFFFFFfffff.......
...........FFFuuuuuuuuuuuuuuuuuFFFffff........
..........FFuuuuuuuuuuuuuuuuuuuFFffff.........
.........FFuuuuuuuuuuuuuuuuuuuuFFfff..........
.........FFuuuuuuuuuuuuuuuuuuuuFFfff..........
..........FFuuuuuuuuuuuuuuuuuuFFffff..........
...........FFFFFFFFFFFFFFFFFFFFFfff...........
............FFFFFFFFFFFFFFFFFFFFff............
.............ddddd..........ddddd.............
............ffffff..........ffffff............
............fffff............fffff............
`

// Color mapping for Pixelbara
const PIXEL_COLORS: Record<string, string> = {
  'E': '#8B6914', // ear outer
  'e': '#C4A020', // ear inner
  'i': '#D4B030', // ear highlight
  'F': '#C4A87C', // fur main
  'f': '#9C8060', // fur shadow
  'n': '#1A1A1A', // eyes (dark)
  'N': '#FFB6C1', // nose highlight
  'o': '#FF9999', // nose outline
  'u': '#E8D4B8', // belly
  'B': '#8B7355', // body outline
  'm': '#4A4A4A', // mouth
  'd': '#4A3828', // feet dark
}

function generatePixelbaraSVG(): string {
  const rows = PIXELBARA_ART.trim().split('\n')
  const pixelSize = 8
  let rects = ''

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]
      if (ch !== '.' && ch !== ' ' && PIXEL_COLORS[ch]) {
        rects += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${PIXEL_COLORS[ch]}" />`
      }
    }
  }

  const width = Math.max(...rows.map(r => r.length)) * pixelSize
  const height = rows.length * pixelSize

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">${rects}</svg>`
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @font-face {
      font-family: 'Press Start 2P';
      src: url('https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2') format('woff2');
    }

    body {
      width: ${OG_WIDTH}px;
      height: ${OG_HEIGHT}px;
      background: #0F172A;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Press Start 2P', monospace;
      position: relative;
      overflow: hidden;
    }

    /* Subtle glow effect */
    .glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      height: 400px;
      background: radial-gradient(ellipse, rgba(34, 197, 94, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .content {
      display: flex;
      align-items: center;
      gap: 48px;
      z-index: 1;
    }

    .pixelbara {
      width: 280px;
      height: auto;
      filter: drop-shadow(0 0 30px rgba(34, 197, 94, 0.2));
    }

    .neun-logo {
      font-size: 96px;
      color: #22C55E;
      text-shadow:
        0 0 60px rgba(34, 197, 94, 0.4),
        0 0 120px rgba(34, 197, 94, 0.2);
      letter-spacing: 12px;
    }
  </style>
</head>
<body>
  <div class="glow"></div>

  <div class="content">
    <div class="pixelbara">
      ${generatePixelbaraSVG()}
    </div>
    <div class="neun-logo">NEUN</div>
  </div>
</body>
</html>
`

async function generateOGImage() {
  console.log('🎨 Generating OG image...')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: OG_WIDTH, height: OG_HEIGHT })
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready)
  await new Promise(resolve => setTimeout(resolve, 500))

  const outputPath = path.join(process.cwd(), 'public', 'og-image.png')

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: OG_WIDTH, height: OG_HEIGHT },
  })

  await browser.close()

  console.log(`✅ OG image saved to: ${outputPath}`)
  console.log(`   Size: ${OG_WIDTH}x${OG_HEIGHT}px`)
}

generateOGImage().catch(console.error)
