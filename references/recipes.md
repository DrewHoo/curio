# Wiring recipes

Read this when you've chosen a lane and need to plug the library into the Vite + React scaffold. Each recipe is the minimum that works; each honors the cross-cutting craft (mobile, URL state, citations) covered in the other reference files.

## Conventional chart — shadcn charts (Recharts v3)

The good-default lane. Add shadcn's chart components (they wrap Recharts and read your Tailwind theme tokens), then:

```jsx
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis } from 'recharts'

export function TrendChart({ data }) {
  return (
    <ChartContainer config={{ value: { label: 'Value', color: 'var(--chart-1)' } }}>
      <LineChart data={data}>
        <XAxis dataKey="date" /><YAxis />
        <ChartTooltip />
        <Line dataKey="value" stroke="var(--chart-1)" dot={false} />
      </LineChart>
    </ChartContainer>
  )
}
```

Colors come from CSS variables so light/dark and theme changes flow through. Recharts is SVG — fine to a few thousand marks; past that, change lanes.

## Quick / grammar-of-graphics — Observable Plot in React

Plot renders to a DOM node; mount it in an effect and re-render on data change.

```jsx
import * as Plot from '@observablehq/plot'
import { useEffect, useRef } from 'react'

export function PlotFigure({ options }) {
  const ref = useRef(null)
  useEffect(() => {
    const chart = Plot.plot(options)
    ref.current.append(chart)
    return () => chart.remove()
  }, [options])
  return <div ref={ref} />
}
// options e.g. { marks: [Plot.dot(data, { x: 'lon', y: 'lat', r: 'mass' })] }
```

For maps: `Plot.plot({ projection: 'equal-earth', marks: [Plot.geo(land), Plot.dot(points, {...})] })` with land from TopoJSON — no tile server, no API key.

## Bespoke — Visx / hand-rolled D3 + SVG

D3 computes; React renders. Use `d3-scale`/`d3-shape` for math, emit JSX yourself.

```jsx
import { scaleUtc, scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'

export function Spark({ data, w, h }) {
  const x = scaleUtc().domain(extent(data, d => d.date)).range([0, w])
  const y = scaleLinear().domain(extent(data, d => d.value)).range([h, 0])
  const d = line().x(p => x(p.date)).y(p => y(p.value))(data)
  return <svg width={w} height={h}><path d={d} fill="none" stroke="var(--accent)" /></svg>
}
```

Hover: scrub with `pointer*` events and a nearest-point search (see `references/mobile-and-responsive.md`). Never call `d3.select()` inside a React component.

## Many marks (~10k–100k) — Canvas 2D, batched

The pattern behind the ~80k-segment NBA career viz. Two stacked canvases: a **base** layer that redraws only on pan/zoom, and a cheap **highlight** layer for the hovered item. Batch draws by color to minimize state changes, coalesce redraws with `requestAnimationFrame`, and keep zoom state in refs so React doesn't re-render on every wheel tick.

```js
// render/canvas.js — the core ideas
function drawBase(ctx, items, transform, dpr) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)                 // device-pixel-ratio aware
  ctx.clearRect(0, 0, width, height)
  const byColor = groupBy(items, i => i.color)           // batch by color
  for (const [color, group] of byColor) {
    ctx.strokeStyle = color; ctx.globalAlpha = ALPHA_BASE
    ctx.beginPath()
    for (const it of group) { /* moveTo/lineTo using transform */ }
    ctx.stroke()                                          // one stroke per color
  }
}
// d3-zoom drives `transform`; on 'zoom', schedule a single rAF that calls drawBase.
// Hit-testing: bucket items into a spatial index; binary-search the bucket under the cursor.
```

Deliberately plain Canvas 2D — no WebGL — is enough at this scale. Only climb to deck.gl/regl when Canvas 2D can't hold 60fps.

## Large local data — DuckDB-WASM (query-first)

Bundle a Parquet at build time (see `references/data-sourcing.md`), load DuckDB in a Web Worker, register the file, and query on filter changes. Only the filtered rows reach the renderer.

```js
import * as duckdb from '@duckdb/duckdb-wasm'

async function initDuckDB() {
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles())
  const worker = new Worker(bundle.mainWorker)           // off the main thread
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
  await db.instantiate(bundle.mainModule)
  const buf = new Uint8Array(await (await fetch('data/points.parquet')).arrayBuffer())
  await db.registerFileBuffer('points.parquet', buf)
  const conn = await db.connect()
  await conn.query(`CREATE TABLE points AS SELECT * FROM read_parquet('points.parquet')`)
  return conn
}
// On filter change: build a WHERE clause, debounce ~300ms, query, hand rows to the renderer.
```

Mind the scale ladder: when filters go wide the result set can balloon — pair with the Canvas 2D lane for the render.

## Heavy compute — Web Worker

When the bottleneck is calculation, not drawing (a simulation, a big aggregation), run it off the main thread so the UI stays responsive.

```js
// worker.js
onmessage = (e) => { postMessage(runSimulation(e.data)) }
// app: const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
// worker.postMessage(params); worker.onmessage = (e) => setResult(e.data)
```

## The design spine — shadcn/ui (Base UI) + Tailwind v4

`@tailwindcss/vite` for the build; shadcn components copied into `src/components/ui/`. Add a dark-mode class toggle and expose chart colors as CSS variables so every lane inherits the theme. Reach for **Tremor** components on top for dashboard/KPI surfaces, or swap the whole spine for **Mantine** if the user wants a batteries-included kit. Fonts self-hosted per `references/meta-and-assets.md`.
