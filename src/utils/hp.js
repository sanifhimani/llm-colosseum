export function getHpColor(pct) {
  if (pct > 0.6) return '#38e858';
  if (pct > 0.3) return '#f0c020';
  return '#e83838';
}
