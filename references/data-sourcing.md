# Finding, fetching, and grounding real data

Read this at step 2 of the workflow — when you have a question and need real data to answer it. The rule that governs everything here: **every number on the page must come from data you actually fetched, and must trace to a citable source.** No fabrication, no estimation, no "plausible illustrative values."

## First move: is there an SDK or an open dataset?

Before scraping HTML, check whether the data has a **first-class SDK or a documented open API**. A huge amount of public data does, and an SDK saves you auth, pagination, and parsing. These are the packages that have earned their place on real projects:

### Python SDKs / clients

| Package | Source it wraps | Good for |
|---|---|---|
| `nba_api` | stats.nba.com | NBA player/team/game stats (used to bake ~5,600 players' careers) |
| `yfinance` | Yahoo Finance | Stock/ETF/crypto historical prices |
| `pandas-datareader` | FRED, Stooq, World Bank, etc. | Economic + financial time series |
| `sodapy` | Socrata Open Data (SODA) | data.gov / city + state open-data portals, **NASA's meteorite landings**, NYC/Chicago/SF datasets |
| `wbdata` / `world_bank_data` | World Bank | Country-level development indicators |
| `census` / `censusdata` | US Census + ACS | Demographics by state/county/tract |
| `pyowm`, `meteostat` | Weather APIs | Current + historical weather |
| `requests` + `pandas.read_html` | Any HTML table | Quick scrape of Wikipedia / reference tables |
| `pyarrow`, `duckdb` | Local files | Read/convert CSV↔Parquet, pre-aggregate before shipping |

### Node / JS SDKs / clients

| Package | Source it wraps | Good for |
|---|---|---|
| `yahoo-finance2` | Yahoo Finance | Adjusted daily closes, dividends, splits (used across the finance projects) |
| `@octokit/rest` | GitHub API | Repo/stars/release/contributor data |
| `d3-dsv` / `csv-parse` | CSV/TSV | Parsing downloaded flat files |
| `node-fetch` / built-in `fetch` | Any REST/JSON API | Generic client with your own rate-limiting |
| `cheerio` | HTML | Server-side scraping when there's no API |
| `apache-arrow` / `parquet-wasm` | Columnar files | Producing Parquet for the DuckDB-WASM lane |

### Where to look when there's no obvious SDK

Portals worth checking, roughly in order of citation quality: **data.gov** and its state/city Socrata siblings, **World Bank / OECD / IMF / UN**, **US Census + BLS + FRED**, **Our World in Data** (clean CSVs + clear sourcing), **Eurostat**, domain-specific official stats (CDC, NASA, USGS, FDA openFDA), **sports-reference** sites and their APIs, and **Wikipedia/Wikidata** for the long tail (cite the underlying source Wikipedia cites, not just the article). Prefer a primary/official source over an aggregator when both exist.

## The gathering approaches that work (baked at build time)

Every one of these ends with **static JSON/Parquet in the build artifact** — no runtime server. Pick by data shape:

**1. Bake with an SDK + polite rate-limiting + a per-item cache.** For large per-entity pulls (e.g. every player's career). Space requests (a sub-second delay), cache each entity to disk so reruns are incremental, and write compact JSON. This is how the NBA career dataset was assembled — ~1 hour once, then cached.

```python
# scripts/fetch_data.py — sketch
import time, json, pathlib
from nba_api.stats.endpoints import playercareerstats

CACHE = pathlib.Path("scripts/.cache"); CACHE.mkdir(parents=True, exist_ok=True)
def fetch_player(pid):
    hit = CACHE / f"{pid}.json"
    if hit.exists(): return json.loads(hit.read_text())      # incremental reruns
    data = playercareerstats.PlayerCareerStats(player_id=pid).get_dict()
    hit.write_text(json.dumps(data))
    time.sleep(0.6)                                           # be a good citizen
    return data
```

**2. Bounded-concurrency fan-out.** For many independent fetches where the source tolerates parallelism. Run a fixed number of workers (say 5) so you don't hammer the API, collect per-item results, and keep going on individual failures rather than aborting the whole run.

```js
// scripts/fetch-data.mjs — the concurrency core
async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length); let cursor = 0
  const pull = async () => {
    while (cursor < items.length) {
      const i = cursor++
      try { results[i] = { ok: true, value: await worker(items[i]) } }
      catch (err) { results[i] = { ok: false, item: items[i], error: err.message } }
    }
  }
  await Promise.all(Array.from({ length: limit }, pull))
  return results
}
```

**3. Scrape + reconcile.** When the truth is spread across tables (e.g. championship history on Wikipedia): scrape each source, then reconcile into one clean dataset with an explicit step, so discrepancies surface instead of hiding. Keep the reconcile script in the repo — it *is* the provenance.

**4. Compute derived metrics at bake time.** Don't ship raw rows and recompute in the browser on every load. Pre-compute the things the viz needs (all-time highs, recovery days, drawdowns, rankings) into compact per-entity JSON so the client just renders.

**5. Bundle a Parquet and query it in-browser.** When the dataset is large and the user should *explore* it interactively (the meteorite case): convert the source to Parquet at build time, bundle it, and query with DuckDB-WASM in a Web Worker. Filtering happens in SQL, and only the filtered rows reach the renderer. See the DuckDB recipe in `references/recipes.md`, and mind the scale ladder — wide filters can un-bound the set, at which point you need the Canvas 2D lane.

### Wire it into the build

```json
"scripts": {
  "fetch": "node scripts/fetch-data.mjs",
  "build": "node scripts/fetch-data.mjs && vite build",
  "build:no-fetch": "vite build"
}
```

Gitignore generated data (`public/data/`) so the repo doesn't bloat — CI regenerates it on each deploy. If the data changes over time, add a `schedule:` cron to the deploy workflow to rebake.

## When you can't ground the exact question

This is the important behavior. If the precise thing asked for isn't backed by citable data, **do not invent it and do not silently substitute.** Instead:

1. Say plainly what you *couldn't* ground and why (no source, paywalled, only survey estimates, wrong granularity).
2. **Offer the nearest thing you _can_ ground**, concretely: *"There's no citable per-neighborhood income data, but the Census ACS has it by ZIP-code tabulation area from a named table — that answers a slightly coarser version of your question. Want me to build that?"*
3. Let the user choose. Redirecting to the groundable adjacent question is almost always more useful than an apology — and infinitely better than a fabricated number.

A page that honestly answers a slightly different question beats a page that dishonestly answers the exact one. Every time.

## Recording the source

The moment you fetch something, capture its citation (label, URL, publisher, access date) into the `sources` model — don't reconstruct it later from memory. See `references/citations.md`. The provenance scripts (`scripts/fetch-*`) staying in the repo is part of the citation too: anyone can see exactly how the numbers were produced.
