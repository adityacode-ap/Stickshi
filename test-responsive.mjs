import { chromium } from 'playwright';

const browser = await chromium.launch();
const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `test-${vp.name}.png`, fullPage: true });
  console.log(`Saved test-${vp.name}.png (${vp.width}x${vp.height})`);
  await page.close();
}

await browser.close();
