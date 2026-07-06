// Rank-ordered categorical palette (top scorer gets --chart-1). Defined as CSS
// variables in index.css so themes/dark mode can flow through.
export const CHART_COLORS = Array.from({ length: 12 }, (_, i) => `var(--chart-${i + 1})`)

export function colorFor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}
