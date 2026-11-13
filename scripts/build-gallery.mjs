import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'output';
const manifest = JSON.parse(readFileSync(`${BASE}/manifest.json`, 'utf8'));
let probe = null;
try { probe = JSON.parse(readFileSync(`${BASE}/network-probe.json`, 'utf8')); } catch (e) {}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const statusColor = { CAPTURED: '#237a3b', BLOCKED: '#b3261e', FAILED: '#b3261e' };
const statusBg = { CAPTURED: 'rgba(35,122,59,.15)', BLOCKED: 'rgba(179,38,30,.15)', FAILED: 'rgba(179,38,30,.15)' };

const vpNames = manifest.viewports.map(v => v.name);

function imgTag(src, alt, cls = '') {
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" class="${cls}" onerror="this.style.opacity=.3">`;
}

const probeBlock = probe ? `
  <div class="card">
    <h2>Network probe (GitHub runner → site)</h2>
    <p><b>Reachable:</b> ${probe.reachable ? '✅ yes' : '❌ no'} · <b>Stage:</b> ${esc(probe.failureStage || 'none')} · <b>Time:</b> ${esc(probe.timestamp)}</p>
    <ul>
      <li>DNS: ${probe.dns && probe.dns.ok ? '✅ ' + esc((probe.dns.addresses || []).join(', ')) : '❌ ' + esc(probe.dns && probe.dns.error)}</li>
      <li>TLS: ${probe.tls && probe.tls.ok ? '✅ ' + esc(probe.tls.protocol) + ' / ' + esc(probe.tls.certSubject) : '❌ ' + esc(probe.tls && probe.tls.error)}</li>
      <li>HTTP: ${probe.http && probe.http.ok ? '✅ ' + esc(probe.http.status) : '❌ ' + esc(probe.http && (probe.http.error || probe.http.status))}</li>
    </ul>
  </div>` : '';

const pageCards = manifest.pages.map(p => {
  const vpThumbs = vpNames.map(vn => {
    const c = p.captures && p.captures[vn];
    if (!c) return '';
    return `<div class="vp">
      <div class="vp-title">${esc(vn)} (${manifest.viewports.find(x=>x.name===vn).width}×${manifest.viewports.find(x=>x.name===vn).height})</div>
      <a href="${esc(c.viewport)}">${imgTag(c.viewport, p.name + ' ' + vn)}</a>
      <div class="links">
        <a href="${esc(c.viewport)}">viewport</a> ·
        <a href="${esc(c.fullPage)}">full page</a>
      </div>
    </div>`;
  }).join('');

  const sectionsBlock = Object.keys(p.sections || {}).length ? Object.entries(p.sections).map(([vn, secs]) => `
    <details><summary>Sections (${esc(vn)})</summary>
      <div class="sections">${secs.map(s => s.file
        ? `<div class="sec"><a href="${esc(s.file)}">${imgTag(s.file, s.label)}</a><div class="sec-label">${esc(s.label)}</div></div>`
        : `<div class="sec err">${esc(s.label)}: ${esc(s.error)}</div>`).join('')}
      </div>
    </details>`).join('') : '';

  const consoleBlock = (p.consoleErrors && p.consoleErrors.length)
    ? `<details><summary>Console errors (${p.consoleErrors.length})</summary><pre>${esc(p.consoleErrors.join('\n'))}</pre></details>` : '<p class="ok">No console errors.</p>';
  const failedReqBlock = (p.failedRequests && p.failedRequests.length)
    ? `<details><summary>Failed requests (${p.failedRequests.length})</summary><pre>${esc(p.failedRequests.map(r=>r.url + ' — ' + (r.failure||'')).join('\n'))}</pre></details>` : '<p class="ok">No failed requests.</p>';
  const imgFailBlock = (p.imageFailures && p.imageFailures.length)
    ? `<details><summary>Image load failures (${p.imageFailures.length})</summary><pre>${esc(p.imageFailures.map(r=>r.url + ' — ' + r.status).join('\n'))}</pre></details>` : '';

  return `
  <div class="page-card">
    <div class="page-head">
      <h3>${esc(p.name)}</h3>
      <span class="badge" style="background:${statusBg[p.status]||'#333'};color:${statusColor[p.status]||'#fff'};border:1px solid ${statusColor[p.status]||'#555'}">${esc(p.status)}</span>
    </div>
    <p class="meta">URL: <a href="${esc(p.url)}">${esc(p.url)}</a> · HTTP ${esc(p.httpStatus)} · Final: ${esc(p.finalUrl)} · Title: ${esc(p.title)}</p>
    ${p.error ? `<p class="err">Error: ${esc(p.error)}</p>` : ''}
    <div class="vp-row">${vpThumbs}</div>
    ${sectionsBlock}
    <div class="reports">${consoleBlock}${failedReqBlock}${imgFailBlock}</div>
  </div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Boardgame Club — Visual QA Gallery</title>
<style>
:root{--bg:#0f1319;--card:#1a202c;--gold:#c9a227;--gold-soft:#e6c65a;--red:#b3261e;--green:#237a3b;--text:#eef0f4;--muted:#9aa1b2;--line:#2b3346}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Tahoma,Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.wrap{max-width:1500px;margin:0 auto;padding:20px}
header{padding:20px 0;border-bottom:1px solid var(--line);margin-bottom:20px}
h1{font-size:26px;font-weight:900;color:var(--gold-soft)}
h2{font-size:18px;color:var(--gold-soft);margin:16px 0 8px}
h3{font-size:16px;margin:0}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}
.page-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:16px 0}
.page-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
.badge{padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700}
.meta{color:var(--muted);font-size:12px;margin:6px 0;word-break:break-all}
.err{color:#ff8a80;font-size:12px;margin:4px 0}
.ok{color:var(--green);font-size:12px;margin:4px 0}
.vp-row{display:flex;flex-wrap:wrap;gap:14px;margin:10px 0}
.vp{flex:1 1 300px;min-width:260px}
.vp-title{font-size:12px;color:var(--gold-soft);margin-bottom:4px;font-weight:700}
.vp img{width:100%;height:auto;border:1px solid var(--line);border-radius:8px;display:block}
.links{font-size:11px;margin-top:4px}
.links a{color:var(--gold-soft);margin:0 4px}
.sections{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0}
.sec{flex:1 1 200px;min-width:180px}
.sec img{width:100%;height:auto;border:1px solid var(--line);border-radius:8px}
.sec-label{font-size:11px;color:var(--muted);margin-top:3px}
.sec.err{color:#ff8a80;font-size:12px}
.reports{margin-top:10px}
.reports details{margin:4px 0}
.reports summary{cursor:pointer;color:var(--gold-soft);font-size:13px}
.reports pre{background:#0a0d12;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:11px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;margin-top:6px}
ul{padding-right:20px;margin:6px 0}
li{margin:3px 0;font-size:13px}
.stat{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 16px;margin:4px;color:var(--muted);font-size:13px}
.stat b{display:block;font-size:18px;color:var(--gold-soft);margin-top:2px}
footer{margin-top:30px;padding:20px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>📸 Boardgame Club — Visual QA Gallery</h1>
  <p style="color:var(--muted)">Last capture: ${esc(manifest.generatedAt)} · Site: <a href="https://dndclub.ir/bgg/" style="color:var(--gold-soft)">dndclub.ir/bgg/</a> · Tool: Playwright Chromium on GitHub-hosted runner</p>
  <div style="margin-top:10px">
    <span class="stat">Pages <b>${manifest.summary.pages}</b></span>
    <span class="stat">Viewports <b>${manifest.summary.viewports}</b></span>
    <span class="stat">Captured <b>${manifest.summary.captured}</b></span>
    <span class="stat">Blocked <b>${manifest.summary.blocked}</b></span>
    <span class="stat">Failed <b>${manifest.summary.failed}</b></span>
  </div>
</header>

${probeBlock}

${pageCards}

<footer>
  <p>Generated by Visual QA Bridge. Read-only inspection; no changes to site, DB, sessions, or users.</p>
  <p>Screenshots are real browser captures (Playwright Chromium), not HTML snapshots.</p>
</footer>
</div>
</body>
</html>`;

writeFileSync(`${BASE}/index.html`, html);
console.log(`Gallery written: ${BASE}/index.html (${manifest.pages.length} pages)`);
