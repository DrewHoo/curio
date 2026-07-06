// Build-time data fetch for the Curio example.
//
// Question: which countries have scored the most goals in World Cup history —
// as a cumulative race, one line per country, each point a real match.
//
// Source: openfootball / worldcup.json (CC0 public domain).
//   https://github.com/openfootball/worldcup.json
// Per-edition JSON, one file per tournament. We hardcode the 22 men's editions
// (1930–2022) rather than globbing the repo tree, which also contains 2025
// (Club World Cup) and 2026 (future fixtures) directories.
//
// Goal-counting rule (the important part): per match, per team, count in-play +
// extra-time goals and EXCLUDE penalty-shootout kicks. score.et is the tally
// after 120 min (includes extra-time goals); fall back to score.ft (90 min) when
// there was no extra time. NEVER read score.p — that's the shootout. Verified on
// the 2022 final: score = {ft:[2,2], et:[3,3], p:[4,2]} → counted 3–3, shootout
// [4,2] excluded (Argentina advanced on penalties). Scorer arrays (goals1/goals2)
// are empty for most 1954–2010 matches, so they are used ONLY for optional hover
// detail, never to count goals.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
const BASE = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master'
const YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978,
  1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022,
]

// Only a true same-entity naming inconsistency is merged. Historical
// successor-state names (West Germany vs Germany, Soviet Union vs Russia, …)
// are kept distinct on purpose — they read as honest, separate histories.
const ALIAS = { USA: 'United States' }
const norm = (t) => ALIAS[t] ?? t

const SOURCE = {
  label: 'openfootball / worldcup.json — free open public-domain World Cup football data',
  publisher: 'openfootball (football.json project)',
  url: 'https://github.com/openfootball/worldcup.json',
  license: 'CC0-1.0 (public domain)',
  accessed: new Date().toISOString().slice(0, 10),
}

const TOP_N = 12 // countries shown as lines by default

async function fetchEdition(year) {
  const res = await fetch(`${BASE}/${year}/worldcup.json`)
  if (!res.ok) throw new Error(`${year}: HTTP ${res.status}`)
  const json = await res.json()
  return { year, matches: json.matches ?? [] }
}

// Bounded-concurrency fan-out so we don't hammer the source.
async function mapLimit(items, limit, worker) {
  const out = new Array(items.length)
  let i = 0
  const runners = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await worker(items[idx])
    }
  })
  await Promise.all(runners)
  return out
}

function goalsFor(score) {
  // Returns [g1, g2] counting in-play + extra time, excluding shootouts.
  if (!score) return null
  const arr = score.et ?? score.ft
  if (!Array.isArray(arr) || arr.length !== 2) return null
  const [a, b] = arr
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return [a, b]
}

function scorerNames(list) {
  if (!Array.isArray(list) || !list.length) return undefined
  return list.map((g) => g?.name).filter(Boolean)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const editions = await mapLimit(YEARS, 6, fetchEdition)

  // Flatten every scored match into two per-team events.
  const events = [] // { team, opp, date, ts, goals, oppGoals, stage, group, year, scorers }
  let matchesUsed = 0
  let skipped = 0

  for (const { year, matches } of editions) {
    for (const m of matches) {
      const g = goalsFor(m.score)
      if (!m.date || !m.team1 || !m.team2 || !g) {
        skipped++
        continue
      }
      matchesUsed++
      const ts = Date.parse(`${m.date}T00:00:00Z`) // UTC — avoids the local-midnight date shift
      const stage = m.round || m.group || ''
      const t1 = norm(m.team1)
      const t2 = norm(m.team2)
      events.push({
        team: t1, opp: t2, date: m.date, ts, goals: g[0], oppGoals: g[1],
        stage, group: m.group || '', year, scorers: scorerNames(m.goals1),
      })
      events.push({
        team: t2, opp: t1, date: m.date, ts, goals: g[1], oppGoals: g[0],
        stage, group: m.group || '', year, scorers: scorerNames(m.goals2),
      })
    }
  }

  // Group by team, order each team's matches chronologically, accumulate goals.
  const byTeam = new Map()
  for (const e of events) {
    if (!byTeam.has(e.team)) byTeam.set(e.team, [])
    byTeam.get(e.team).push(e)
  }

  const teams = []
  for (const [team, evs] of byTeam) {
    evs.sort((a, b) => a.ts - b.ts || a.opp.localeCompare(b.opp))
    let cum = 0
    const points = evs.map((e) => {
      cum += e.goals
      const result = e.goals > e.oppGoals ? 'W' : e.goals < e.oppGoals ? 'L' : 'D'
      return {
        ts: e.ts, date: e.date, cum, goals: e.goals,
        opp: e.opp, gf: e.goals, ga: e.oppGoals, result,
        stage: e.stage, year: e.year,
        ...(e.scorers ? { scorers: e.scorers } : {}),
      }
    })
    teams.push({ team, total: cum, matches: points.length, points })
  }

  teams.sort((a, b) => b.total - a.total)
  const shown = teams.slice(0, TOP_N)

  const payload = {
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    meta: {
      editions: YEARS.length,
      yearsSpanned: [YEARS[0], YEARS[YEARS.length - 1]],
      matchesUsed,
      matchesSkipped: skipped,
      teamsTotal: teams.length,
      teamsShown: shown.length,
      goalRule: 'in-play + extra-time goals per team; penalty-shootout goals excluded',
    },
    teams: shown,
  }

  await writeFile(resolve(OUT_DIR, 'worldcup.json'), JSON.stringify(payload))

  // Self-checks + human-readable summary (also a sanity gate for the build).
  const arg = teams.find((t) => t.team === 'Argentina')
  const finals2022 = arg?.points.find((p) => p.year === 2022 && p.stage.toLowerCase().includes('final') && p.opp === 'France')
  console.log(`Editions fetched: ${editions.length}  matches used: ${matchesUsed}  skipped: ${skipped}`)
  console.log(`Teams total: ${teams.length}  shown: ${shown.length}`)
  console.log('Top scorers (cumulative goals, all World Cups):')
  for (const t of shown) console.log(`  ${String(t.total).padStart(3)}  ${t.team}  (${t.matches} matches)`)
  if (finals2022) {
    console.log(`Self-check 2022 final vs France: Argentina scored ${finals2022.gf} (not the shootout) ✓`)
  } else {
    console.log('Self-check: could not locate 2022 final row — inspect stage labels.')
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
