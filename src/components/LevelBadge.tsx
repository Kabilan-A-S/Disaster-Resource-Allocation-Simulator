export function LevelBadge({ level }: { level: string }) {
  const norm = (level || 'LOW').toUpperCase();
  let color = '#83cbb4'; // Low (green)
  if (norm === 'CRITICAL') color = '#f47b7e'; // Critical (red)
  else if (norm === 'HIGH') color = '#eaa862'; // High (orange)
  else if (norm === 'MEDIUM') color = '#dfba68'; // Medium (yellow)

  return (
    <div className="priority-badge" style={{ borderColor: color, color }}>
      <i style={{ background: color, width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }}></i>
      {norm}
    </div>
  );
}
