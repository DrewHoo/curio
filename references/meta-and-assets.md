# Head, self-hosted fonts, favicon, and OG preview

Read this when polishing a page for sharing — the `<head>`, the fonts, and the preview image that shows when the URL is pasted into a chat or social app. This is the "make it look right the moment someone else sees it" pass.

## The `<head>`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>{Compelling, scannable, ≤ 60 chars}</title>
    <meta name="description" content="{1–2 sentences: what the page shows + who it's for}" />

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />

    <!-- Open Graph (Facebook, Reddit, Bluesky, LinkedIn) -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{Same as <title> or richer}" />
    <meta property="og:description" content="{Engaging hook, ~200 chars}" />
    <meta property="og:image" content="{ABSOLUTE url to og.png}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="{Describe the preview for screen readers}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{Same as og:title}" />
    <meta name="twitter:description" content="{Same as og:description}" />
    <meta name="twitter:image" content="{ABSOLUTE url to og.png}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Use **relative** favicon hrefs (or `import.meta.env.BASE_URL`) so they resolve under any fork's `/<repo>/` base. The **`og:image` must be an absolute URL** — social scrapers don't resolve relative paths. For a project page that's `https://<username>.github.io/<repo>/og.png`; on a fork you can template it from the repo at build time, or set it once when you know the final URL.

## Self-hosted variable fonts (CSP-clean, no CDN)

Don't link a font CDN — self-host WOFF2 variable fonts. Cleaner CSP (`font-src 'self'`), no third-party origin, one file covers all weights.

1. Get the variable WOFF2 (e.g. Fraunces, Inter). **Subset** it to the glyphs you use (Latin + digits + punctuation) with `fonttools` / `glyphhanger` — often an 80%+ size cut.
2. Put files in `public/fonts/` and declare them:

```css
@font-face {
  font-family: 'Fraunces'; font-style: normal; font-weight: 300 900;
  src: url('/fonts/Fraunces.woff2') format('woff2-variations');
  font-display: swap;
}
@font-face {
  font-family: 'Inter'; font-style: normal; font-weight: 100 900;
  src: url('/fonts/Inter.woff2') format('woff2-variations');
  font-display: swap;
}
:root { --font-display: 'Fraunces', Georgia, serif; --font-body: 'Inter', system-ui, sans-serif; }
```

3. Preload the body face for first paint: `<link rel="preload" as="font" type="font/woff2" href="/fonts/Inter.woff2" crossorigin>`.

Default pairings: **Fraunces + Inter** (editorial), **Instrument Serif + Instrument Sans** (distinctive), **Inter/Geist + a mono** (dashboards; use `font-variant-numeric: tabular-nums` for aligned figures).

## Favicon + OG image generation

Rasterize from hand-authored SVG with `sharp` on your machine; commit the outputs (CI doesn't regenerate them).

```js
// scripts/gen-assets.mjs — sketch
import sharp from 'sharp'
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#1f5c8c"/><!-- one bold, simple glyph --></svg>`
await sharp(Buffer.from(favicon)).resize(32).png().toFile('public/favicon-32.png')
await sharp(Buffer.from(favicon)).resize(180).png().toFile('public/apple-touch-icon.png')
// og.png at 1200×630: dark gradient, big title + subtitle left, a representative
// mini-visual right (a sample of THIS page's chart), the URL in the footer.
```

Favicon must read at 16px — bold background, high-contrast glyph, no fine detail. The OG image should preview *this* page's actual visualization, not a generic logo.

## OG cache-busting after a redesign

Reddit / X / Bluesky / LinkedIn cache OG fetches for hours to days. After changing the image, force a refresh with the platform's card validator (Facebook Sharing Debugger, Twitter Card Validator) before re-announcing, or share once with a `?v=2` cache-buster.
