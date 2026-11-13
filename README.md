# Boardgame Club — Visual QA Bridge

Read-only visual QA infrastructure for `https://dndclub.ir/bgg/`.

- Browser: Playwright (Chromium) runs on **GitHub-hosted runner only**.
- No browser is installed on cPanel or on the owner's laptop.
- Output: real browser screenshots (desktop 1366×768, wide 1600×900, mobile 390×844), HTTP status, console errors, failed requests.
- Gallery: static HTML published to GitHub Pages at a fixed URL.

## Gallery URL (after first successful run)

`https://drezamer.github.io/boardgame-club-visual-qa/`

(Replace `drezamer` with the actual GitHub account if different.)

## How to run again

1. Open the repository on GitHub.
2. Go to **Actions** → **Boardgame Club - Visual QA**.
3. Click **Run workflow** (`workflow_dispatch`). No secrets or PAT required for manual runs.
4. Wait for `probe` → `capture` → `deploy` to finish.
5. Open the gallery URL above.

## Optional: trigger from OpenCode / deploy process (no new token in code)

If automated triggering is desired, use a GitHub PAT with **minimum scopes**:
- `repo` (or `public_repo` for public repos) for `workflow_dispatch` via API, OR
- a fine-grained PAT with **Actions: write** on this repository only.

Store the PAT outside the repository (e.g., in the owner's secret manager / cPanel env), never in code, repository, or webroot. Trigger via:

```
POST https://api.github.com/repos/<owner>/boardgame-club-visual-qa/actions/workflows/visual-qa.yml/dispatches
{ "ref": "main" }
```

## Safety

- No changes to site code, database, sessions, or user data.
- Only public pages are captured and published.
- `my.php` and login-gated pages are captured only in their public (logged-out) state.
- No form submission, registration, or data modification is performed.

## Files

- `.github/workflows/visual-qa.yml` — workflow (probe + capture + deploy)
- `scripts/probe-network.mjs` — DNS/TLS/HTTP probe
- `scripts/pages.mjs` — real page inventory (from sitemap.xml)
- `scripts/capture.mjs` — Playwright capture
- `scripts/build-gallery.mjs` — static gallery generator
- `package.json` / `package-lock.json`
