import { useRef, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { TeamSeries, EditionPoint } from '../lib/types.ts'
import { colorFor } from '../lib/colors.ts'

const yearOf = (ts: number) => String(new Date(ts).getUTCFullYear())
const DOMAIN: [number, number] = [Date.UTC(1930, 0, 1), Date.UTC(2023, 0, 1)]
const TICKS = [1930, 1950, 1970, 1990, 2010, 2022].map((y) => Date.UTC(y, 0, 1))

// openfootball labels group games "Matchday N"; read that as "Group stage".
const stageLabel = (s: string) => (/^matchday/i.test(s) ? 'Group stage' : s)

interface Hover { team: string; color: string; point: EditionPoint; cx: number; cy: number }

export function GoalRaceChart({ teams, highlight, onHighlight, height }: {
  teams: TeamSeries[]
  highlight: string | null
  onHighlight: (team: string) => void
  height: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [sticky, setSticky] = useState(false)

  function show(h: Hover, pin: boolean) {
    setHover(h)
    if (pin) setSticky(true)
  }
  function clear() {
    setSticky(false)
    setHover(null)
  }

  // Each dot owns its own pointer events, so a hover can only ever be this team's
  // point at this position — never another team's game sharing the x.
  function makeDot(team: string, color: string, dim: boolean) {
    return function Dot(props: { cx?: number; cy?: number; payload?: EditionPoint }) {
      const { cx, cy, payload } = props
      if (cx == null || cy == null || !payload) return <g />
      const active = hover?.team === team && hover?.point.year === payload.year
      return (
        <circle
          key={`${team}-${payload.year}`}
          cx={cx} cy={cy} r={active ? 5.5 : 3.5}
          fill={color} stroke="var(--card)" strokeWidth={1.25}
          opacity={dim ? 0.12 : 1}
          style={{ cursor: 'pointer', pointerEvents: dim ? 'none' : 'auto' }}
          onMouseEnter={() => { if (!sticky) show({ team, color, point: payload, cx, cy }, false) }}
          onMouseLeave={() => { if (!sticky) setHover(null) }}
          onClick={(e) => { e.stopPropagation(); show({ team, color, point: payload, cx, cy }, true) }}
        />
      )
    }
  }

  // Clamp the tooltip inside the chart width, and flip it below the dot when
  // there isn't room above (otherwise a top dot's tooltip spills off the top).
  const w = wrapRef.current?.clientWidth ?? 640
  const tipLeft = hover ? Math.min(Math.max(hover.cx, 132), w - 132) : 0
  const placeBelow = hover ? hover.cy < 220 : false

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} onClick={clear}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart margin={{ top: 8, right: 14, bottom: 4, left: -6 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            type="number" dataKey="ts" domain={DOMAIN} ticks={TICKS}
            scale="time" tickFormatter={yearOf} allowDuplicatedCategory={false}
            tick={{ fontSize: 12, fill: 'var(--muted)' }} stroke="var(--line)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--muted)' }} stroke="var(--line)"
            width={40} allowDecimals={false}
          />
          {teams.map((t, i) => {
            const on = highlight === t.team
            const dim = highlight !== null && !on
            const color = colorFor(i)
            return (
              <Line
                key={t.team} data={t.points} dataKey="cum" name={t.team}
                stroke={color} strokeOpacity={dim ? 0.1 : 1}
                strokeWidth={on ? 2.8 : 1.6}
                type="linear" isAnimationActive={false}
                dot={makeDot(t.team, color, dim)} activeDot={false}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      {hover && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', left: tipLeft,
            top: placeBelow ? hover.cy + 14 : hover.cy - 12,
            transform: placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            pointerEvents: 'none', zIndex: 5,
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10,
            padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 244,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: hover.color, flex: 'none' }} />
            {hover.team}
            <span className="tabular" style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 600 }}>
              {hover.point.cum} total
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', margin: '3px 0 8px' }}>
            World Cup {hover.point.year} · scored <b style={{ color: 'var(--ink)' }}>{hover.point.goals}</b>
            {' '}in {hover.point.games.length} {hover.point.games.length === 1 ? 'match' : 'matches'}
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
            {hover.point.games.map((g, gi) => (
              <li key={gi} className="tabular" style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12.5 }}>
                <span style={{
                  flex: 'none', width: 15, fontWeight: 700, textAlign: 'center',
                  color: g.result === 'W' ? '#2b7454' : g.result === 'L' ? '#b23a2e' : 'var(--faint)',
                }}>{g.result}</span>
                <span style={{ flex: 'none', fontWeight: 600 }}>{g.gf}–{g.ga}</span>
                <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  vs {g.opp}
                </span>
                <span style={{ marginLeft: 'auto', flex: 'none', color: 'var(--faint)', fontSize: 11 }}>
                  {stageLabel(g.stage)}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={(e) => { e.stopPropagation(); onHighlight(hover.team) }}
            style={{
              pointerEvents: 'auto', marginTop: 9, font: 'inherit', fontSize: 11.5, cursor: 'pointer',
              padding: '4px 9px', borderRadius: 7, border: '1px solid var(--line)',
              background: 'var(--card)', color: 'var(--accent)',
            }}
          >
            {highlight === hover.team ? 'Showing only this line' : 'Isolate this line'}
          </button>
        </div>
      )}
    </div>
  )
}
