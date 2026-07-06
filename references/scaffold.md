# Scaffold a new site (owner-agnostic)

Read this when standing up a brand-new repo and getting it serving at `https://<username>.github.io/<repo>/`. Nothing here is tied to a particular GitHub account — the `base` path and deploy target are derived at build time, so a fork Just Works for whoever owns it.

If you forked this template, most of this is already in place — skim to confirm, then go build.

## 1. Create the repo

Via the GitHub UI: **"Use this template" → name the repo** (the name becomes the URL path — pick a good slug, lowercase, kebab-case). Or from a terminal:

```bash
gh repo create <slug> --public --template DrewHoo/curio --clone
cd <slug>
```

Public is required for free GitHub Pages on personal accounts.

## 2. Bootstrap with Vite

Already present in the template. From scratch it's:

```bash
npm create vite@latest . -- --template react
npm install
```

JS or TS both fine. Any static-output stack works (Astro, plain HTML, Observable Framework) as long as you end with a static `dist/`.

## 3. Derive the `base` path — do not hardcode the owner

GitHub Pages serves a project site from `/<repo>/`, so Vite's `base` must match the repo name. Derive it from the CI environment so it's correct for any fork, and fall back to `/` for local dev:

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GITHUB_REPOSITORY is "owner/repo" in Actions; take the repo half.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS ? `/${repo}/` : '/'

export default defineConfig({ base, plugins: [react()] })
```

If you serve static assets from JS, build URLs with `import.meta.env.BASE_URL` (e.g. `fetch(\`${import.meta.env.BASE_URL}data/index.json\`)`) so Vite rewrites them for the fork's path. **Getting `base` wrong is the #1 cause of a blank page with 404s on every asset.**

(Using a custom domain instead of the `github.io` path? Then `base` is `/` — set it explicitly and add a `CNAME`.)

## 4. Add the deploy workflow

`.github/workflows/deploy.yml` — Actions builds and publishes to Pages. No owner appears anywhere.

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: ['main'] }
  workflow_dispatch:
  # Uncomment to rebake time-varying data on a schedule:
  # schedule: [{ cron: '30 22 * * *' }]

permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: 'pages', cancel-in-progress: false }

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      # If a build script fetches data (scripts/fetch-*), it runs inside `npm run build`.
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }
  deploy:
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**CI gotcha — native binaries on Linux.** If the project pulls in `lightningcss` (Tailwind v4), `sharp`, `@rollup/rollup-*`, or `@swc/core`, a macOS-generated lockfile can skip the Linux variant and the build dies with `Cannot find module '…linux-x64-gnu.node'`. Fix by installing the Linux binary between `npm ci` and `npm run build`:

```yaml
      - run: npm ci
      - run: npm install --no-save lightningcss-linux-x64-gnu   # or the one that's missing
      - run: npm run build
```

## 5. Enable Pages (source = Actions)

**Settings → Pages → Build and deployment → Source: GitHub Actions.** Or:

```bash
gh api -X POST repos/{owner}/<slug>/pages -f build_type=workflow 2>&1 || \
  gh api -X PUT  repos/{owner}/<slug>/pages -f build_type=workflow
```

(`{owner}` resolves to whoever owns the fork; the OR handles first-time vs. existing config.)

## 6. Push and verify

```bash
git push origin main
gh run watch                      # wait for green
curl -sI https://<username>.github.io/<slug>/ | head -5   # expect HTTP/2 200
```

Then polish: `references/meta-and-assets.md` for the head/OG/favicon/font pass, `references/url-state.md` for shareability, `references/citations.md` for the sources footer.

## Troubleshooting

- **Blank page, 404s for every asset** → `base` wrong or not derived. Recheck step 3, rebuild, redeploy.
- **Workflow green but site didn't update** → Pages may still be serving from a branch. `gh api repos/{owner}/<slug>/pages --jq .build_type`; if `legacy`, `PUT build_type=workflow` and re-run.
- **OG image cached old after a redesign** → social platforms cache for hours–days; force a refresh with the platform's card validator (see `references/meta-and-assets.md`).
