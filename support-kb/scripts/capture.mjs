import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('../../rendered/', import.meta.url)));
const evidence = new URL('../../evidence/', import.meta.url);
await mkdir(evidence, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(root + sep)) throw new Error('outside static output');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, colorScheme: 'light' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`); });
  const url = `http://127.0.0.1:${server.address().port}/kb/incidents/4471-review/`;
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.match(await page.locator('main').innerText(), /412 unique reports/);
  assert.match(await page.locator('.sum').innerText(), /412 reports merged into #4471/);
  const analysis = JSON.parse(await readFile(new URL('analysis.json', evidence), 'utf8'));
  assert.equal(await page.locator('.stamp b').innerText(), analysis.deskRef);
  assert.equal(await page.locator('a[href="https://github.com/Sakadin/megadevpepe/issues/1"]').count(), 1);
  assert.equal(await page.locator('a[href="https://github.com/Sakadin/megadevpepe/issues/2"]').count(), 1);
  assert.doesNotMatch(await page.locator('main').innerText(), /not yet filed/);
  assert.match(await page.locator('main').innerText(), /booking-v3 form retired/);
  assert.match(await page.locator('main').innerText(), /not_planned/);
  const controls = page.locator('select[aria-label="tenant"]');
  assert.equal(await controls.count(), 2);
  assert.equal(await page.locator('.verdict').innerText(), 'different causes — keep apart');
  await controls.nth(1).selectOption('alder.physio');
  await page.waitForFunction(() => document.querySelector('.verdict').textContent === 'same cause — merge');
  await page.locator('select[aria-label="channel"]').nth(1).selectOption('app');
  await page.waitForFunction(() => document.querySelector('.verdict').textContent === 'different causes — keep apart');
  await page.reload({ waitUntil: 'networkidle' });
  assert.deepEqual(errors, []);
  await page.screenshot({ path: fileURLToPath(new URL('4471-review-desktop.png', evidence)), fullPage: true });
  await page.pdf({ path: fileURLToPath(new URL('4471-review.pdf', evidence)), format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: fileURLToPath(new URL('4471-review-mobile.png', evidence)), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, 'the page must not overflow the mobile viewport');
  const result = {
    page: 'rendered/kb/incidents/4471-review/index.html',
    browser: await browser.version(),
    checks: ['unique report total', 'original cause-table total', 'derived desk reference', 'both filed issue links', 'newer engineering outcomes and distinct closure reasons', 'hydrated dedupe controls: split, merge, split', 'no page errors or failed requests', 'no mobile horizontal overflow'],
    errors
  };
  await writeFile(new URL('browser-checks.json', evidence), JSON.stringify(result, null, 2) + '\n');
  console.log(`Browser checks passed: ${result.checks.join('; ')}.`);
  console.log('Captured the rendered page as desktop/mobile PNGs and PDF.');
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
