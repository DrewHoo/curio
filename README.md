# Curio

**Settle a fascinating question with real data — and publish an interactive, cited, shareable chart free on GitHub Pages.**

A *curio* is a rare, intriguing object you show people. This is a template repo *and* an [agent skill](SKILL.md) that turns a hard-to-answer question into exactly that. You bring a curiosity — *"which NBA players outlived the most careers of their peers?"*, *"if you'd bought any all-time high in history, would you have ended up okay?"* — an LLM (or you) finds and **fetches real, citable data**, builds an interactive visualization, and deploys a static site to `https://<your-username>.github.io/<repo>/`. Every number on the page traces to a real source.

It's built for **everyone**: whether or not you write code, you use it the same way — the difference is only how many opinions you bring.

## What you get

- **Question-first, not chart-first.** Start from what you want to understand; the data and the controls emerge from the exploration.
- **Real, cited data — never fabricated.** The workflow fetches actual data (often via open-data APIs and their Python/Node SDKs) and grounds every figure in a citable source.
- **Interactive + shareable.** Hover/scrub that works on touch, and view state that round-trips through the URL so any view is a copy-pasteable link.
- **Mobile-first + evocative.** Phone-first responsive output with good typographic and color defaults out of the box.
- **Free hosting.** Static build, deployed to your own GitHub Pages by a GitHub Action. No server, no accounts, no cost.

## Make a curio

### With an AI agent (recommended)
Point an agent that supports [skills](SKILL.md) at this repo and tell it what you want to know:

> "Which NBA players outlived the most careers of people who debuted at the same time or later? Make me a curio."

It reads [`SKILL.md`](SKILL.md), finds and fetches the data, builds the page, and deploys it.

### By hand
1. Click **"Use this template"** and name your repo (the name becomes the URL).
2. `npm install && npm run dev`.
3. Put your data-fetching logic in `scripts/`, your config/content where the skill directs, and iterate.
4. `git push` — the included GitHub Action builds and deploys to your Pages URL.

Enable Pages once under **Settings → Pages → Source: GitHub Actions**.

## The one rule

**No fabricated data, ever.** If the exact question can't be grounded in citable data, the skill tells you — and offers the nearest question it *can* ground. A curio that honestly answers a slightly different question beats one that dishonestly answers the exact one.

## Inside the skill

- [`SKILL.md`](SKILL.md) — the question-first workflow and the prime directive.
- [`references/data-sourcing.md`](references/data-sourcing.md) — finding, fetching, and grounding real data; open-data SDKs; gathering patterns.
- [`references/choosing-libraries.md`](references/choosing-libraries.md) — current dataviz + design library choices, the scale ladder, canvas/WebGL.
- [`references/recipes.md`](references/recipes.md) — wiring recipes per rendering lane.
- [`references/scaffold.md`](references/scaffold.md) — owner-agnostic Vite + GitHub Pages setup.
- [`references/citations.md`](references/citations.md) · [`url-state.md`](references/url-state.md) · [`mobile-and-responsive.md`](references/mobile-and-responsive.md) · [`meta-and-assets.md`](references/meta-and-assets.md) — the cross-cutting craft.

## License

MIT — fork it, make curios, make everyone smarter.
