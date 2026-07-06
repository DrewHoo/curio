import { useEffect, useMemo, useState } from 'react'
import type { Dataset } from './lib/types.ts'
import { colorFor } from './lib/colors.ts'
import { GoalRaceChart } from './components/GoalRaceChart.tsx'
import { Sources } from './components/Sources.tsx'
import { ShareButton } from './components/ShareButton.tsx'

function readTeamParam(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('team')
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  )
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 640)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return narrow
}

export function App() {
  const [data, setData] = useState<Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(() => readTeamParam())
  const narrow = useIsNarrow()

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/worldcup.json`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: Dataset) => setData(d))
      .catch((e) => setError(String(e)))
  }, [])

  // Validate the URL param against loaded data; drop it if it's not a shown team.
  useEffect(() => {
    if (!data || highlight === null) return
    if (!data.teams.some((t) => t.team === highlight)) setHighlight(null)
  }, [data, highlight])

  // Mirror highlight → URL (replaceState keeps history clean and the link shareable).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (highlight) params.set('team', highlight)
    else params.delete('team')
    const qs = params.toString()
    const next = qs ? `${location.pathname}?${qs}` : location.pathname
    if (next !== location.pathname + location.search) history.replaceState(null, '', next)
  }, [highlight])

  const leader = data?.teams[0]
  const hasBothGermanys = useMemo(
    () => !!data && ['West Germany', 'Germany'].every((n) => data.teams.some((t) => t.team === n)),
    [data],
  )

  function toggle(team: string) {
    setHighlight((cur) => (cur === team ? null : team))
  }

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: narrow ? '28px 16px 72px' : '48px 28px 96px' }}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>
        A Curio · built on open data
      </p>
      <h1 style={{ fontSize: narrow ? 30 : 42, lineHeight: 1.08, margin: '10px 0 14px', textWrap: 'balance' }}>
        The World Cup Goal Race
      </h1>
      <p style={{ fontSize: narrow ? 16 : 18, color: 'var(--muted)', margin: '0 0 6px', maxWidth: 640 }}>
        Every goal every nation has scored across World Cup history, 1930–2022, as a cumulative race.
        Each line is a country; each point is one World Cup — hover it for every game they played that tournament.
      </p>
      {leader && (
        <p className="tabular" style={{ fontSize: 15, color: 'var(--ink)', margin: '0 0 22px' }}>
          {leader.team} leads with <b>{leader.total}</b> goals across {leader.matches} matches.
        </p>
      )}

      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14,
        padding: narrow ? '14px 8px 10px' : '18px 18px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '0 8px 6px' }}>
          <span style={{ fontSize: 12, color: 'var(--faint)', letterSpacing: '0.04em' }}>cumulative goals →</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {highlight && (
              <button onClick={() => setHighlight(null)} style={{
                font: 'inherit', fontSize: 13, cursor: 'pointer', padding: '6px 12px',
                borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)',
              }}>Show all</button>
            )}
            <ShareButton />
          </div>
        </div>

        {error && <p style={{ color: '#9c560f', padding: 24 }}>Couldn’t load the data: {error}</p>}
        {!data && !error && <p style={{ color: 'var(--faint)', padding: 24 }}>Loading the last 92 years of World Cups…</p>}
        {data && (
          <GoalRaceChart
            teams={data.teams}
            highlight={highlight}
            onHighlight={toggle}
            height={narrow ? 380 : 470}
          />
        )}

        {/* Legend doubles as the control — tap a country to isolate its line. */}
        {data && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 8px 4px' }}>
            {data.teams.map((t, i) => {
              const on = highlight === t.team
              const dim = highlight !== null && !on
              return (
                <button
                  key={t.team}
                  onClick={() => toggle(t.team)}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                    font: 'inherit', fontSize: 13, padding: '5px 10px', borderRadius: 999,
                    border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`,
                    background: on ? 'var(--ink)' : 'var(--card)',
                    color: on ? 'var(--card)' : 'var(--ink)',
                    opacity: dim ? 0.45 : 1,
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: colorFor(i), flex: 'none' }} />
                  {t.team}
                  <span className="tabular" style={{ color: on ? 'var(--card)' : 'var(--muted)' }}>{t.total}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 14.5, color: 'var(--muted)', maxWidth: 660, display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>
          <b style={{ color: 'var(--ink)' }}>Reading it:</b> each point is one World Cup for that country, placed at its
          running goal total. Hover a point (or tap, on a phone) to see every game they played that tournament, in order.
          Tap a country in the legend to isolate its run.
        </p>
        {hasBothGermanys && (
          <p style={{ margin: 0 }}>
            <b style={{ color: 'var(--ink)' }}>An honesty note:</b> West Germany (1954–1990) and Germany are kept as
            separate lines, exactly as the source records them — combined, they’d rival Brazil at the top.
          </p>
        )}
        {data && (
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--faint)' }}>
            {data.meta.matchesUsed} matches across {data.meta.editions} tournaments. {data.meta.goalRule}.
          </p>
        )}
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '28px 0 18px' }} />
      {data && <Sources sources={[data.source]} />}

      <p style={{ marginTop: 28, fontSize: 12.5, color: 'var(--faint)' }}>
        Made with <a href="https://github.com/DrewHoo/curio" style={{ color: 'var(--accent)' }}>Curio</a>
        {data ? ` · data generated ${data.generatedAt.slice(0, 10)}` : ''}. A question, settled with receipts.
      </p>
    </main>
  )
}
