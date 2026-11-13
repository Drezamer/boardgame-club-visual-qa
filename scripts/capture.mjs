import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'wide', width: 1600, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

const BASE = 'output';
const SHOT_DIR = `${BASE}/screenshots`;
mkdirSync(BASE, { recursive: true });
mkdirSync(SHOT_DIR, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  site: 'https://dndclub.ir/bgg/',
  tool: 'Playwright (Chromium) on GitHub-hosted runner',
  viewports: VIEWPORTS,
  pages: [],
  summary: { pages: 0, viewports: VIEWPORTS.length, captured: 0, blocked: 0, failed: 0 }
};

const browser = await chromium.launch({ headless: true });

for (const p of PAGES) {
  const pageEntry = {
    slug: p.slug,
    name: p.name,
    url: p.url,
    status: 'FAILED',
    httpStatus: null,
    finalUrl: null,
    title: null,
    timestamp: new Date().toISOString(),
    captures: {},
    sections: {},
    consoleErrors: [],
    failedRequests: [],
    imageFailures: [],
    error: null
  };

  const slugDir = `${SHOT_DIR}/${p.slug}`;
  mkdirSync(slugDir, { recursive: true });

  let pageFailed = false;
  let pageBlocked = false;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'fa-IR',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    const imageFailures = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));
    page.on('requestfailed', req => failedRequests.push({ url: req.url(), failure: req.failure() && req.failure().errorText }));
    page.on('response', res => {
      try {
        if (res.request().resourceType() === 'image' && !res.ok()) {
          imageFailures.push({ url: res.url(), status: res.status() });
        }
      } catch (e) {}
    });

    let httpStatus = null;
    let finalUrl = null;
    let title = null;
    let navError = null;
    try {
      const resp = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 45000 });
      httpStatus = resp ? resp.status() : null;
      finalUrl = page.url();
      title = await page.title();
      await page.waitForTimeout(2000);
    } catch (e) {
      navError = String(e && e.message || e);
    }

    // merge into pageEntry (last viewport wins for title/status; store per-viewport status via captures)
    if (vp.name === 'desktop') {
      pageEntry.httpStatus = httpStatus;
      pageEntry.finalUrl = finalUrl;
      pageEntry.title = title;
    }
    if (navError) {
      pageEntry.error = (pageEntry.error ? pageEntry.error + '; ' : '') + `${vp.name}: ${navError}`;
    }
    // accumulate console/network (dedup not required; store union from desktop run)
    if (vp.name === 'desktop') {
      pageEntry.consoleErrors = consoleErrors;
      pageEntry.failedRequests = failedRequests;
      pageEntry.imageFailures = imageFailures;
    }

    const relShot = `screenshots/${p.slug}`;
    const vpFile = `${p.slug}__${vp.name}.png`;
    const fullFile = `${p.slug}__${vp.name}__full.png`;
    try {
      await page.screenshot({ path: `${slugDir}/${vpFile}` });
      await page.screenshot({ path: `${slugDir}/${fullFile}`, fullPage: true });
    } catch (e) {
      pageEntry.error = (pageEntry.error ? pageEntry.error + '; ' : '') + `screenshot(${vp.name}): ${e && e.message || e}`;
    }

    pageEntry.captures[vp.name] = {
      viewport: `${relShot}/${vpFile}`,
      fullPage: `${relShot}/${fullFile}`
    };

    // sections (home only, on every viewport? do on desktop + mobile; work order says home sections. Do on all viewports for consistency but can be heavy. Limit to desktop+mobile.)
    if (p.sections && (vp.name === 'desktop' || vp.name === 'mobile')) {
      const secList = [];
      for (const sec of p.sections) {
        const secFile = `${p.slug}__section-${sec.id}__${vp.name}.png`;
        try {
          const loc = page.locator(sec.selector).first();
          await loc.waitFor({ state: 'visible', timeout: 8000 });
          await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
          await page.waitForTimeout(600);
          await page.screenshot({ path: `${slugDir}/${secFile}` });
          secList.push({ id: sec.id, label: sec.label, file: `${relShot}/${secFile}` });
        } catch (e) {
          secList.push({ id: sec.id, label: sec.label, error: String(e && e.message || e) });
        }
      }
      pageEntry.sections[vp.name] = secList;
    }

    await context.close();

    if (navError) pageFailed = true;
    if (httpStatus && httpStatus >= 400) pageFailed = true;
  }

  // determine status
  if (pageFailed) {
    pageEntry.status = 'FAILED';
    manifest.summary.failed++;
  } else if (pageBlocked) {
    pageEntry.status = 'BLOCKED';
    manifest.summary.blocked++;
  } else {
    pageEntry.status = 'CAPTURED';
    manifest.summary.captured++;
  }

  manifest.pages.push(pageEntry);
  manifest.summary.pages++;
}

await browser.close();
writeFileSync(`${BASE}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Captured ${manifest.summary.captured}/${manifest.summary.pages} pages across ${VIEWPORTS.length} viewports.`);
