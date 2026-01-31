/**
 * Generate Favicons for NEUN
 * Creates favicon.ico, apple-touch-icon, and various sizes
 */

import puppeteer from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
]

function generateFaviconHTML(size: number): string {
  // Adjust font size based on icon size
  const fontSize = Math.floor(size * 0.7)

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${size}px;
      height: ${size}px;
      background: #0F172A;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Press Start 2P', monospace;
    }

    .n {
      font-size: ${fontSize}px;
      font-weight: bold;
      color: #22C55E;
      text-shadow: ${size > 32 ? '0 0 ' + Math.floor(size * 0.1) + 'px rgba(34, 197, 94, 0.5)' : 'none'};
      line-height: 1;
      margin-top: ${Math.floor(size * 0.05)}px;
    }
  </style>
</head>
<body>
  <div class="n">N</div>
</body>
</html>
`
}

async function generateFavicons() {
  console.log('🎨 Generating favicons...')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const publicDir = path.join(process.cwd(), 'public')
  const iconsDir = path.join(publicDir, 'icons')
  const appDir = path.join(process.cwd(), 'app')

  // Ensure directories exist
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

  for (const { name, size } of SIZES) {
    const page = await browser.newPage()
    await page.setViewport({ width: size, height: size })
    await page.setContent(generateFaviconHTML(size), { waitUntil: 'networkidle0' })

    // Wait for font to load
    await page.evaluate(() => document.fonts.ready)
    await new Promise(resolve => setTimeout(resolve, 300))

    let outputPath: string

    if (name === 'apple-touch-icon.png') {
      outputPath = path.join(publicDir, name)
    } else if (name.startsWith('icon-')) {
      outputPath = path.join(iconsDir, name)
    } else {
      outputPath = path.join(publicDir, name)
    }

    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: size, height: size },
    })

    console.log(`  ✅ ${name} (${size}x${size})`)
    await page.close()
  }

  // Copy 32x32 to app directory as favicon.ico (Next.js will use this)
  const favicon32 = path.join(publicDir, 'favicon-32x32.png')
  const appFavicon = path.join(appDir, 'favicon.ico')
  fs.copyFileSync(favicon32, appFavicon)
  console.log(`  ✅ app/favicon.ico (copied from 32x32)`)

  // Also copy to public/favicon.ico
  const publicFavicon = path.join(publicDir, 'favicon.ico')
  fs.copyFileSync(favicon32, publicFavicon)
  console.log(`  ✅ public/favicon.ico (copied from 32x32)`)

  await browser.close()

  console.log('\n✅ All favicons generated!')
}

generateFavicons().catch(console.error)
