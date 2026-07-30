const LINE_COLORS = [
  '#22d3ee',
  '#f59e0b',
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#60a5fa',
  '#fb7185',
  '#eab308',
  '#2dd4bf',
  '#c084fc',
];

export function gfpSeriesColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length];
}
