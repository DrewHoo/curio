---
name: curio
description: >-
  Turn a hard-to-answer question into a Curio — an interactive, cited, shareable
  data visualization published free on GitHub Pages. Use when someone has a
  curiosity they want to settle with data ("which NBA players outlived the most
  of their peers?", "if you only bought stocks at all-time highs, would you end
  up okay?"), or says "explore/visualize/chart some data", "answer a question
  with data", "make a data viz / data essay", "find data about X and show it",
  "make a curio", or "fork this template". Drives a question-first workflow:
  start from the curiosity, find and FETCH real citable data, render it, and let
  the controls emerge — then deploy a static site to
  <username>.github.io/<repo>/. Covers choosing dataviz + design libraries
  (2026-current), data sourcing via open APIs and their Python/Node SDKs,
  canvas/WebGL for large data, shareable URL state, citations, mobile
  responsiveness, and the GitHub Pages deploy.
---

# Curio — settle a fascinating question, with receipts

A **curio** is a rare, intriguing object you show people. This skill turns a **hard-to-answer question** — the kind you'd argue about but can actually settle with data — into exactly that: an interactive, **honestly-sourced** visualization, published free on GitHub Pages, that makes everyone who sees it a little smarter.

It's for everyone. Someone who has never opened a terminal and someone who writes D3 in their sleep use it the same way; the difference is only how many opinions they bring. The best curios come from questions like *"which NBA players outlived the most careers of people who debuted at the same time or later?"* or *"if you'd bought a stock at any all-time high in history, would you have ended up okay after the crash?"* — bar-argument questions, settled with receipts.

The output is a static site that lands at `https://<their-username>.github.io/<repo-name>/` (or a custom domain), works on a phone first, round-trips its state through the URL so any view is shareable, and **cites every number it shows**.

## The prime directive: real, cited data — no exceptions

**Never fabricate, estimate, round-trip through memory, or "illustrate with plausible numbers."** Every value on the page must come from data you actually fetched, and must trace to a citable source. This is the entire trust proposition of the skill; there is no version of "good enough" that skips it.

- If you can fetch and ground the data, do it, and record the source (see `references/data-sourcing.md` and `references/citations.md`).
- If you **cannot** ground the exact question asked, do not invent it and do not silently substitute. Say so, and **offer the nearest thing you _can_ ground**: *"I couldn't find citable data for per-city figures, but I did find state-level data from the Census ACS that answers a version of your question — want that?"* Redirecting to the groundable adjacent question is almost always more useful than an apology, and always better than a fabricated answer.
- The build ships a visible **"sources not provided" badge** if a chart has no citation, and prints a loud warning. This should be **exceedingly rare** — the authoring flow above grounds everything, so the badge exists only as a backstop for pages later hand-edited to strip sources. Treat seeing it as a bug.

## The workflow is a question, not a questionnaire

Do **not** open by asking "what chart type / how much data / what controls / where's your file." Those are the wrong first questions — the answers emerge from the data, not from the user. Open on the question:

1. **"What do you want to explore or understand?"** A curiosity, a claim to check, a hunch. That's the seed.
   - *Rare inversion:* sometimes the **dataset itself** is the object of curiosity ("let me play with the NASA meteorite landings"). Then "explore this data" is a perfectly good question — start from the data.
2. **Find and fetch real data.** Propose credible sources, then actually pull them — don't ask the user to supply a file. Many open datasets have first-class **Python or Node SDKs** (e.g. `nba_api`, `yfinance`, `sodapy`); reach for those before scraping. Ground everything. See `references/data-sourcing.md`.
3. **Render something small, then let the visualization grow.** Put the simplest honest view on screen, look at it *with* the user, and let what's interesting pull the next move — a filter here, a breakdown there. **Controls are discovered, not specified up front**; you genuinely cannot foresee which slices illuminate before you've seen the data.
4. **Pick libraries reactively, from what the data turns out to need.** The menus in `references/choosing-libraries.md` are *your* internal knowledge, not a form for the user. They fire as decisions — "this resolved to 80k points → Canvas 2D lane," "this is geographic → Plot + d3-geo." If the user is an engineer with an opinion ("use Mantine," "I want raw D3"), take it and move on.
5. **Publish and make it shareable.** Wire URL state, citations, OG card, and deploy. See `references/scaffold.md`, `references/url-state.md`, `references/meta-and-assets.md`.

Iterate 3→4 as many times as the exploration wants. A finished curio is one where the question has an honest, legible, cited answer someone can share.

## Choosing the tools (your internal menu)

You choose the rendering and design approach; the user should almost never hear the menu. Full detail in `references/choosing-libraries.md`; the shape of it:

- **Conventional chart, fast and good** → Recharts v3 (via shadcn charts). **Quick exploratory / grammar-of-graphics** → Observable Plot. **Bespoke, full control** → Visx (D3 math, React owns the DOM). **Maps** → Observable Plot `geo` + d3-geo + TopoJSON. **Grid / heatmap / table** → no chart lib, just CSS Grid.
- **The shared design spine is shadcn/ui (Base UI) + Tailwind v4** — it scales from two toggles to a full filter panel without a re-platform, which is exactly why you don't have to decide "how control-heavy" up front. Reach for **Mantine** when you want a batteries-included kit, or **hand-rolled CSS + tokens + a characterful font** for a maximally identity-forward data essay. Self-host fonts (Fraunces + Inter is a strong default). See `references/meta-and-assets.md`.

### Scale is a decision ladder, not a single choice

"Render thousands of shapes" is usually the wrong goal. Climb only as far as the data forces you:

1. **Bound the data first** — filter/aggregate (DuckDB-WASM for big local data) or window off-screen rows. Often enough on its own.
2. **Still large after bounding (~10k–100k marks)? Canvas 2D**, hand-rolled and batched (group draws by color, alpha tiers, `requestAnimationFrame`-coalesced, device-pixel-ratio aware, spatial-bucket hit-testing).
3. **Canvas 2D can't hold 60fps (100k–1M+)? WebGL** — deck.gl or regl.
4. **Bottleneck is _computation_, not drawing?** That's a different axis — move the heavy work to a **Web Worker** (or WASM) so the UI stays responsive.

Recipes for each lane, including the DuckDB-WASM and Canvas 2D patterns, are in `references/recipes.md`.

## Reference files

Read the ones relevant to the current step; don't preload them all.

- **`references/data-sourcing.md`** — Find, fetch, and ground real data. Open-data sources, their Python/Node SDKs, the data-gathering patterns (build-time bake, polite rate-limiting + caching, bounded-concurrency fan-out, scrape + reconcile, bundle-a-parquet), and the "ground the adjacent question" discipline.
- **`references/choosing-libraries.md`** — The full 2026-current dataviz + design library menus, as internal decision logic, with the scale ladder and canvas guidance.
- **`references/recipes.md`** — Wiring recipes: shadcn charts, Observable Plot in React, Visx/D3+SVG, Canvas 2D (batched), DuckDB-WASM, Web Worker compute, the design spine.
- **`references/scaffold.md`** — Stand up a new repo: Vite + owner-agnostic `base` path, the Actions → Pages deploy, enabling Pages, verify. No owner hardcoding.
- **`references/citations.md`** — The first-class `sources` model, the auto-rendered footnote/footer, per-chart references, and the warn + badge backstop.
- **`references/url-state.md`** — Round-trip view state through the URL with `replaceState`, validate against loaded data, and the "Share this view" button.
- **`references/mobile-and-responsive.md`** — Phone-first interaction (`pointer*` events, `touch-action`), responsive column-hiding, and the UTC-midnight date pitfall.
- **`references/meta-and-assets.md`** — The `<head>` (title, description, OG/Twitter cards), self-hosted variable fonts, favicon + preview-image generation.

## Pre-share checklist

Before the URL goes anywhere:

- [ ] Every number on the page traces to a real, fetched source; the **Sources** section lists them; no "sources not provided" badge.
- [ ] Loads at `https://<username>.github.io/<repo>/` (200, not 404) with no console errors.
- [ ] Readable on a phone with no horizontal scroll; hover-style interactions work by touch (scrub with a finger).
- [ ] Changing a filter/selection updates the URL; reloading that URL restores the same view; the Share button copies it.
- [ ] Pasting the URL into a chat/social app shows the OG card with the right title, description, and image.
- [ ] The question the page set out to explore has a legible answer someone could screenshot and understand.

## What not to bother with

- **Asking the user to choose a chart library or design system.** That's your call, made reactively. The menu is internal.
- **Specifying controls up front.** Start minimal; grow the UI from what the data reveals.
- **A server, backend, or database.** Everything is static — data is fetched and baked at build time (or queried in-browser with DuckDB-WASM over a bundled file). If a design seems to need a server, reconsider the design.
- **Real-time / live data feeds.** Bake at build time; schedule a rebuild if the data should refresh.
- **A bespoke design system or hand-built chart primitives.** Curate existing libraries; don't reinvent them.
- **Placeholder or "for illustration" numbers, ever.** See the prime directive.
