import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { TeamSeries, GamePoint } from '../lib/types.ts'
import { colorFor } from '../lib/colors.ts'

const yearOf = (ts: number) => String(new Date(ts).getUTCFullYear())
const DOMAIN: [number, number] = [Date.UTC(1930, 0, 1), Date.UTC(2023, 0, 1)]
const TICKS = [1930, 1950, 1970, 1990, 2010, 2022].map((y) => Date.UTC(y, 0, 1))

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

interface TipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; stroke: string; payload: GamePoint }>
  highlight?: string | null
}

function TooltipContent({ active, payload, highlight }: TipProps) {
  if (!active || !payload?.length) return null
  let rows = payload.filter((e) => e && e.payload && typeof e.value === 'number')
  if (highlight) rows = rows.filter((e) => e.name === highlight)
  if (!rows.length) return null
  rows = rows.slice().sort((a, b) => b.value - a.value).slice(0, 4)

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10,
      padding: '10px 12px', boxShadow: '0 6px 20px rgba(0,0,0,0.10)', maxWidth: 260,
    }}>
      {rows.map((e, i) => {
        const p = e.payload
        return (
          <div key={i} style={{ marginBottom: i < rows.length - 1 ? 9 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: e.stroke, flex: 'none' }} />
              {e.name}
              <span className="tabular" style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{p.cum} total</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
              {p.goals > 0
                ? <><b style={{ color: 'var(--ink)' }}>Scored {p.goals}</b> vs {p.opp}</>
                : <>Scored 0 vs {p.opp}</>}
              {' · '}{p.result === 'W' ? 'won' : p.result === 'L' ? 'lost' : 'drew'} {p.gf}–{p.ga}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 1 }}>
              {p.stage ? `${p.stage} · ` : ''}{p.year} · {longDate(p.date)}
              {p.scorers?.length ? ` · ${p.scorers.join(', ')}` : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function GoalRaceChart({ teams, highlight, onHighlight, height }: {
  teams: TeamSeries[]
  highlight: string | null
  onHighlight: (team: string) => void
  height: number
}) {
  return (
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
        <Tooltip content={<TooltipContent highlight={highlight} />} />
        {teams.map((t, i) => {
          const dim = highlight !== null && highlight !== t.team
          return (
            <Line
              key={t.team} data={t.points} dataKey="cum" name={t.team}
              stroke={colorFor(i)} strokeOpacity={dim ? 0.1 : 1}
              strokeWidth={highlight === t.team ? 2.8 : 1.6}
              type="monotone" dot={false} isAnimationActive={false}
              activeDot={{ r: 4, onClick: () => onHighlight(t.team), style: { cursor: 'pointer' } }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
