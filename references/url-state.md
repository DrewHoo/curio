# Shareable URL state + Share button

Read this when adding shareability — every meaningful view choice (selection, filter, zoom range) should round-trip through the URL so any view a user lands on is copy-pasteable. "Shareable" is one of the core goals; this is how it's met.

## Read state on mount

```js
function readInitialState() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const selected = p.get('t') || null
  const range = p.get('r') || null
  let zoom = null
  const z = p.get('z')
  if (z?.includes(',')) {
    const [a, b] = z.split(',').map(s => new Date(`${s}T00:00:00Z`))
    if (!isNaN(a) && !isNaN(b) && a < b) zoom = [a, b]
  }
  return { selected, range, zoom }
}
```

## Validate against loaded data

URL params are untrusted — validate after the data loads, and fall back to defaults.

```js
useEffect(() => {
  if (!index) return
  const known = new Set(index.items.map(i => i.id))
  if (!selected || !known.has(selected)) setSelected(DEFAULT_ID)
}, [index, selected])
```

## Mirror state → URL with `replaceState`

```js
useEffect(() => {
  const p = new URLSearchParams()
  if (selected && selected !== DEFAULT_ID) p.set('t', selected)   // omit defaults
  if (range && range !== 'all') p.set('r', range)
  if (zoom) p.set('z', `${iso(zoom[0])},${iso(zoom[1])}`)
  const qs = p.toString()
  const next = qs ? `${location.pathname}?${qs}` : location.pathname
  if (next !== location.pathname + location.search) history.replaceState(null, '', next)
}, [selected, range, zoom])
```

- **`replaceState`, not `pushState`** — interactions shouldn't stack back-button entries; clicking 20 items shouldn't need 20 back-presses. The URL stays current and shareable; history stays clean.
- **Omit defaults** — keeps shared URLs and the homepage URL short.
- **User actions vs. URL-load:** route UI events through small wrappers that clear dependent state (e.g. changing the selection clears an incompatible zoom), but let the initial URL read set state directly so a shared link with both params is preserved.

## Share button

Pair URL state with an obvious button — don't make people hunt the address bar.

```jsx
function ShareButton() {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    try { await navigator.clipboard.writeText(location.href) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  return <button onClick={share}>{copied ? '✓ Link copied' : 'Share this view'}</button>
}
```

Place it in the controls bar next to the filters, not orphaned in a corner. Every `replaceState` change keeps `location.href` current, so the button always copies exactly what's on screen.
