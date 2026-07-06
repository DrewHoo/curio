# Choosing libraries (your internal menu)

Read this when the exploration has revealed enough about the data's shape and scale to commit to a rendering + design approach. **This is your decision logic, not a form for the user.** They should hear a recommendation ("this is geographic, so I'll map it") or nothing at all — never a menu. If the user is an engineer with an opinion, take it and skip the deliberation.

Everything here is current as of mid-2026. Libraries move; re-verify before leaning hard on a specific version claim.

## Dataviz rendering — pick by use case

| If the viz is… | Reach for | Runner-up | Notes |
|---|---|---|---|
| **Conventional chart** (bar/line/area/pie), quick and good-looking | **Recharts v3** via **shadcn charts** (owned code, tokenized colors, TS rewrite) | **Observable Plot** (terse grammar-of-graphics) | Nivo / Chart.js / Victory are stable but stagnant — not first choices in 2026. Recharts is SVG, so it slows past ~5k marks. |
| **Quick exploratory / grammar-of-graphics** | **Observable Plot** (concise, great defaults, no React needed) | Recharts | Ideal for EDA and for the "let me see it fast" step. Pairs naturally with DuckDB-WASM. |
| **Bespoke, full control** — the chart *is* the design | **Visx** (`@visx/*` — D3 for math, React owns the DOM; ~15kB, modular) | **D3 v7 utility modules** direct (`d3-scale`/`d3-shape`/`d3-array`) | Never let D3 touch the DOM inside React (`d3.select()`/enter-exit is the anti-pattern). Let React render; D3 computes. |
| **Maps / geospatial** | **Observable Plot `geo` mark + d3-geo + TopoJSON** (pure SVG, no tile server, no API key — perfect for Pages) | **MapLibre GL + deck.gl** for point-scale/tiles | Avoid react-simple-maps (dormant, React-18-capped). MapLibre needs a basemap, which is heavier. |
| **Many marks (~10k–100k)**, pan/zoom, mostly static | **Canvas 2D**, hand-rolled + batched | **PixiJS / Konva** (scene-graph abstraction) | See the ladder + recipe. This is a real lane, not a footnote. |
| **Huge / GPU-scale (100k–1M+)** or GPU-driven interaction | **deck.gl** (WebGL2/WebGPU) or **regl-scatterplot** (~20M pts) | ECharts canvas/GL (batteries-included) | The tier past hand-rolled Canvas 2D. |
| **In-browser data engine** (filter big local data) | **DuckDB-WASM** (lazy-load in a Web Worker; reads Parquet/CSV over HTTP) | **Arquero** (tiny dplyr-style JS, no ~3.5MB WASM) | Still the clear 2026 pick; ~10–100× faster than alternatives on analytical queries. |
| **Grid / heatmap / table-shaped** | **No charting library** — CSS Grid + imperative class toggles for hover | — | For grids and sortable tables, HTML/CSS beats any chart lib. |

**Worth knowing:** **Mosaic + vgplot** (Observable Plot + DuckDB-WASM) cross-filters millions of rows across linked views client-side — the productionized form of the "query-first" pattern; consider it for ambitious interactive big-data pages. **Observable Framework** is a static-site generator purpose-built for data apps, a real alternative to the Vite+React scaffold when a project doesn't need React.

## The scale decision ladder

Do not jump to canvas/WebGL reflexively. Climb only as far as the data forces you:

1. **Bound the data first.** Filter/aggregate (push it into DuckDB-WASM for big local data) or window off-screen rows. An SVG library is fine when the *live* mark count is low, even if the dataset is huge. This step alone solves most cases.
2. **Still large after bounding (~10k–100k marks)? Canvas 2D**, hand-rolled and batched. Caveat learned the hard way: a "query-first" strategy **un-bounds itself when filters go wide** — the filtered set balloons back toward the full dataset and SVG chokes. That's exactly when you drop to Canvas 2D.
3. **Canvas 2D can't hold 60fps (100k–1M+, GPU interaction)? WebGL** — deck.gl / regl.
4. **Bottleneck is _computation_, not drawing?** Different axis entirely. A heavy simulation or aggregation that freezes the UI belongs in a **Web Worker** (or WASM), regardless of which rendering lane you're in.

## Design / UI — pick by page character

| If the page is… | Reach for | Runner-up | Notes |
|---|---|---|---|
| **Anything, by default** (the shared spine) | **shadcn/ui (Base UI) + Tailwind v4** | — | Owned components, gorgeous neutral defaults, zero lock-in. Spans "two toggles" to "full filter panel" without a re-platform — which is why you don't decide control-heaviness up front. |
| **Identity-forward, single-viz data essay** | The spine **+ CSS Modules for bespoke layout + a characterful self-hosted font** (Fraunces + Inter) | **Hand-rolled CSS + design tokens** (maximum identity) | The serif gives instant personality a non-engineer can't get wrong. |
| **Control-heavy** (many filters, selects, sliders, date pickers) | The spine **+ Tremor** for the chart/KPI surface | **Mantine v9** (batteries-included kit) | Tremor (now Vercel-owned) gives good-looking dashboards fast. Mantine if you'd rather one rich kit than assemble. |
| **Dense enterprise controls** | **Ant Design v6** | Mantine | Only when you truly want its heavy control set. |

**Do not start from:** MUI v4 + CRA (dead), runtime CSS-in-JS (being abandoned industry-wide for zero-runtime extraction). The July-2026 shift to know: shadcn/ui's default primitive layer is now **Base UI** (Radix still works via `-b radix`, but its cadence slowed).

## Typography (self-hosted, CSP-clean)

Ship **WOFF2 variable fonts, subset** to your glyph range, served from `'self'` (no font CDN — cleaner CSP and no third-party origin on a static Pages SPA). Defaults that look designed, not defaulted:

- **Editorial data essay:** Fraunces (display serif) + Inter (body). Distinctive alt: Instrument Serif + Instrument Sans.
- **Dashboard / control-heavy:** Inter or Geist throughout + a mono (JetBrains Mono / Geist Mono) for figures, with `font-variant-numeric: tabular-nums`.

Setup detail in `references/meta-and-assets.md`.
