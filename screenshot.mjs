import puppeteer from 'puppeteer';

const OUT = '/private/tmp/claude/-Users-dahyekim/2d20e23b-a06a-420d-a7ca-a668b1423922/scratchpad';
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

// Homepage hero
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: `${OUT}/hero.png` });

// Scroll to featured + footer
await page.evaluate(() => window.scrollBy(0, 800));
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/featured.png` });

// Hover a job card to see mini pixelbara + tooltip
const card = await page.$('a[href^="/careers/"]');
if (card) {
  await card.hover();
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${OUT}/card-hover.png` });
}

// 404 page (smoking pixelbara)
await page.goto('http://localhost:3000/nonexistent-page-xyz', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/404.png` });

await browser.close();
console.log('Screenshots saved');
