# Citations — the sources model, footer, and badge

Read this whenever the page shows data (i.e. always). Citations aren't a footnote you add at the end — they're captured at fetch time and rendered as a first-class part of the page. This is the visible half of the prime directive; the invisible half is having actually fetched the data (see `references/data-sourcing.md`).

## The `sources` model

Sources are structured objects with stable ids. Capture them when you fetch, not from memory later.

```js
// src/data/sources.js
export const sources = [
  {
    id: 'usbr',
    label: 'Lake Powell & Lake Mead elevations',
    publisher: 'US Bureau of Reclamation',
    url: 'https://www.usbr.gov/...',
    accessed: '2026-07-05',       // ISO date you pulled it
    note: 'Daily reservoir elevation, ft above sea level',   // optional
  },
]
```

Every chart references the source(s) that back it by id:

```js
{ type: 'line', data: 'levels', x: 'date', y: 'elevation_ft', sourceRef: 'usbr' }
// multiple: sourceRefs: ['usbr', 'noaa']
```

## The auto-rendered footer

A single component renders the Sources section from the model, regardless of which rendering lane drew the charts. Charts show a small superscript linking to their source.

```jsx
export function Sources({ sources }) {
  if (!sources?.length) return <MissingSourcesBadge />        // backstop, see below
  return (
    <section className="sources" aria-label="Sources">
      <h2>Sources</h2>
      <ol>
        {sources.map(s => (
          <li key={s.id} id={`src-${s.id}`}>
            <a href={s.url} rel="noreferrer">{s.label}</a>
            {s.publisher && <> — {s.publisher}</>}
            {s.accessed && <> (accessed {s.accessed})</>}
            {s.note && <div className="src-note">{s.note}</div>}
          </li>
        ))}
      </ol>
    </section>
  )
}
```

Keeping the fetch/scrape scripts (`scripts/fetch-*`) in the repo is part of the citation too — provenance anyone can inspect. Link to them from the Sources section when the derivation is non-obvious.

## The warn + badge backstop

If a chart has no `sourceRef`, or `sources` is empty:

- **Build prints a loud warning** naming the uncited chart(s).
- **The page renders a visible "⚠ Sources not provided" badge** near the offending chart / in the footer.

```jsx
function MissingSourcesBadge() {
  return <p className="badge-warn" role="note">⚠ Sources not provided — treat these figures as unverified.</p>
}
```

This is a **backstop, and should be exceedingly rare.** The authoring flow grounds everything in real fetched data, so an uncited chart means something went wrong — a page hand-edited later to strip sources, or a chart wired up before its data was sourced. Treat the badge as a bug to fix, not a state to ship in.

The build **warns**; it does not hard-fail. Rationale: the far more common failure mode is a fork someone edits by hand, and a broken deploy helps no one — a loud, visible badge that travels with the page (including into the OG preview if it's above the fold) is the honest signal. If a project wants stricter guarantees it can flip the warning to an error in its own build script, but that's opt-in, not the default.
