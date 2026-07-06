export interface GamePoint {
  ts: number // UTC timestamp of the match date
  date: string // 'YYYY-MM-DD'
  cum: number // cumulative goals for this team through this match
  goals: number // goals this team scored in this match (in-play + ET, no shootout)
  opp: string
  gf: number
  ga: number
  result: 'W' | 'L' | 'D'
  stage: string
  year: number
  scorers?: string[]
}

export interface TeamSeries {
  team: string
  total: number
  matches: number
  points: GamePoint[]
}

export interface Source {
  label: string
  publisher: string
  url: string
  license?: string
  accessed: string
}

export interface Dataset {
  generatedAt: string
  source: Source
  meta: {
    editions: number
    yearsSpanned: [number, number]
    matchesUsed: number
    matchesSkipped: number
    teamsTotal: number
    teamsShown: number
    goalRule: string
  }
  teams: TeamSeries[]
}
