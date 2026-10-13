import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResourceBarChartProps {
  data: { name: string; required: number; available: number }[];
}

export function ResourceBarChart({ data }: ResourceBarChartProps) {
  return (
    <div style={{ height: 300, width: '100%', marginTop: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#263a50" vertical={false} />
          <XAxis dataKey="name" stroke="#718ba6" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#718ba6" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value > 1000 ? `${(value/1000).toFixed(0)}k` : String(value)} />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: '#0d1d30', border: '1px solid #263a50', borderRadius: '8px', color: '#edf2f7' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#98abc0' }} />
          <Bar dataKey="required" name="Required" fill="#dfba68" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="available" name="Available" fill="#83cbb4" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
