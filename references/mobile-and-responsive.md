# Mobile-first responsive design + the UTC-midnight date pitfall

Read this when interactions work on your desktop but break for the viewers who actually matter — people on phones, and people west of GMT. Both are bugs that don't show up in local dev and embarrass the page after it's shared.

## The phone is the primary viewer

Most data-viz pages get shared on chat/social and opened on a phone first. Design for that, then scale up.

### Viewport meta (in `<head>`)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Without it the page renders at 980px scaled down — broken. (Already in the head template in `references/meta-and-assets.md`.)

### Pointer events, not mouse events

`onMouseMove` never fires on touch, so a finger scrubbing a chart does nothing. Use `pointer*` and branch on `pointerType`.

```jsx
function onPointerDown(e) {
  const touch = e.pointerType === 'touch' || e.pointerType === 'pen'
  if (touch) updateHoverAt(svgXFromEvent(e))            // finger = scrub tooltip
  else       beginBrush(svgXFromEvent(e))               // mouse = drag-to-zoom
  e.currentTarget.setPointerCapture?.(e.pointerId)       // keep events when finger slides off
}
```

### `touch-action: pan-y`

```css
.chart svg { touch-action: pan-y; }
```

Vertical page scroll still passes through, but horizontal finger drags go to your scrub handler instead of fighting the browser.

### Hide expensive columns/sections at small widths

```jsx
<th className="col-hide-mobile">Name</th>
<td className="col-hide-mobile">{row.name}</td>
```
```css
@media (max-width: 600px) {
  .col-hide-mobile { display: none; }
  .table th, .table td { padding: 5px 6px; font-size: 12px; }
}
```

Keep the column you'd sort by; drop wordy text columns. Don't pin fixed tooltip widths — inconsistent widths flicker the layout while scrubbing.

## The UTC-midnight date pitfall

If your data stores dates as bare `'YYYY-MM-DD'` strings (recommended — short, sortable, unambiguous), `new Date(d)` parses them as **UTC midnight**. Format or scale them with plain `timeFormat`/`scaleTime` and the reader's **local** timezone shifts every date back a day for anyone west of GMT.

Symptom: the latest point shows as "yesterday" for US viewers; hover labels are one day early.

Fix — use the UTC-aware variants throughout:

```js
import { scaleUtc } from 'd3-scale'          // not scaleTime
import { utcFormat } from 'd3-time-format'    // not timeFormat
const fmtDate = utcFormat('%b %e, %Y')
```

For non-d3 display, force the timezone:

```js
new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
```

The Date objects don't change — only how you read them does.
