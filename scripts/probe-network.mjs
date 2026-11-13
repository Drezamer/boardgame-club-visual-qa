// Network probe: runner -> https://dndclub.ir/bgg/
// Writes output/network-probe.json. Exits non-zero on failure.
import dns from 'node:dns/promises';
import https from 'node:https';
import tls from 'node:tls';
import { writeFileSync, mkdirSync } from 'node:fs';

const HOST = 'dndclub.ir';
const URL = 'https://dndclub.ir/bgg/';
const OUT = 'output/network-probe.json';
mkdirSync('output', { recursive: true });

const result = {
  host: HOST,
  url: URL,
  timestamp: new Date().toISOString(),
  dns: { ok: false },
  tls: { ok: false },
  http: { ok: false },
  reachable: false,
  failureStage: null,
  notes: []
};

let exitCode = 0;
try {
  // DNS
  try {
    const addrs = await dns.lookup(HOST, { all: true });
    result.dns = { ok: true, addresses: addrs.map(a => a.address), family: addrs.map(a => a.family) };
  } catch (e) {
    result.dns = { ok: false, error: String(e && e.message || e) };
    result.failureStage = 'DNS';
    throw e;
  }

  // TLS
  try {
    await new Promise((resolve, reject) => {
      const socket = tls.connect({ host: HOST, port: 443, servername: HOST, timeout: 15000 }, () => {
        const cert = socket.getPeerCertificate();
        result.tls = {
          ok: true,
          authorized: socket.authorized,
          authorizationError: socket.authorizationError || null,
          protocol: socket.getProtocol(),
          cipher: socket.getCipher() && socket.getCipher().name,
          certSubject: cert && cert.subject && cert.subject.CN,
          certIssuer: cert && cert.issuer && cert.issuer.CN,
          validFrom: cert && cert.valid_from,
          validTo: cert && cert.valid_to
        };
        socket.end();
        resolve();
      });
      socket.on('error', reject);
      socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS timeout')); });
    });
  } catch (e) {
    result.tls = { ok: false, error: String(e && e.message || e) };
    if (!result.failureStage) result.failureStage = 'TLS';
    throw e;
  }

  // HTTP
  try {
    const httpResult = await new Promise((resolve, reject) => {
      const req = https.get(URL, { timeout: 30000 }, (res) => {
        let body = '';
        res.on('data', c => { if (body.length < 2000) body += c; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, bodyPreview: body.slice(0, 500), finalUrl: URL }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('HTTP timeout')); });
    });
    result.http = { ok: true, status: httpResult.status, finalUrl: httpResult.finalUrl, bodyPreview: httpResult.bodyPreview, headers: { server: httpResult.headers.server, contentType: httpResult.headers['content-type'] } };
    if (httpResult.status >= 400) {
      result.http.ok = false;
      result.failureStage = 'HTTP_STATUS';
      result.notes.push('HTTP status >= 400');
    }
  } catch (e) {
    result.http = { ok: false, error: String(e && e.message || e) };
    if (!result.failureStage) result.failureStage = 'HTTP';
    throw e;
  }

  result.reachable = result.dns.ok && result.tls.ok && result.http.ok;
  if (!result.reachable && !result.failureStage) result.failureStage = 'UNKNOWN';
} catch (e) {
  if (!result.failureStage) result.failureStage = 'EXCEPTION';
  result.exception = String(e && e.message || e);
  exitCode = 1;
}

if (!result.reachable) exitCode = 1;
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ reachable: result.reachable, failureStage: result.failureStage, dns: result.dns.ok, tls: result.tls.ok, http: result.http.ok, httpStatus: result.http.status }, null, 2));
process.exit(exitCode);
