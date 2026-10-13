import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PriorityDonutProps {
  zones: any[];
}

const COLORS: Record<string, string> = {
  Critical: '#f47b7e', // Red
  High: '#eaa862',     // Orange
  Medium: '#dfba68',   // Yellow
  Low: '#83cbb4'       // Green
};

export function PriorityDonut({ zones }: PriorityDonutProps) {
  const getLevel = (z: any) => (z.level || z.priorityLevel || 'LOW').toUpperCase();

  const counts = {
    Critical: zones.filter(z => getLevel(z) === 'CRITICAL').length,
    High: zones.filter(z => getLevel(z) === 'HIGH').length,
    Medium: zones.filter(z => getLevel(z) === 'MEDIUM').length,
    Low: zones.filter(z => getLevel(z) === 'LOW').length,
  };

  // Fixed order for both Pie and Legend: Critical, High, Medium, Low
  const pieData = [
    { name: 'Critical', value: counts.Critical, fill: COLORS.Critical },
    { name: 'High', value: counts.High, fill: COLORS.High },
    { name: 'Medium', value: counts.Medium, fill: COLORS.Medium },
    { name: 'Low', value: counts.Low, fill: COLORS.Low },
  ];

  const hasData = pieData.some(d => d.value > 0);

  const topZones = [...zones].sort((a, b) => {
    const scoreA = a.priorityScore ?? a.priority ?? 0;
    const scoreB = b.priorityScore ?? b.priority ?? 0;
    return scoreB - scoreA;
  }).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 210, width: '100%' }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="46%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0d1d30', border: '1px solid #263a50', borderRadius: '8px', color: '#edf2f7' }}
                itemStyle={{ color: '#edf2f7' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#98abc0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#718ba6', fontSize: 12 }}>
            No zones prioritized yet
          </div>
        )}
      </div>

      <div className="priority-list">
        {topZones.map(z => {
          const lvl = getLevel(z);
          return (
            <div key={z.id || z.name} className="priority-list-item">
              <div>
                <b>{z.name}</b>
                <small>{(z.population || 0).toLocaleString()} pop</small>
              </div>
              <span className={`badge-${lvl.toLowerCase()}`}>
                {lvl}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
