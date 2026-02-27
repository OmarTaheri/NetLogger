import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { date: string; count: number }[];
}

export default function VisitorsOverTimeChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="hud-corners bg-hud-surface/50 border border-hud-border p-4">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(v) => v.slice(5)}
            stroke="rgba(255,255,255,0.1)"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
            stroke="rgba(255,255,255,0.1)"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,102,0,0.3)',
              fontFamily: 'monospace',
              fontSize: 11,
              textTransform: 'uppercase',
            }}
            labelStyle={{ color: '#ff6600' }}
            itemStyle={{ color: '#e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ff6600"
            strokeWidth={2}
            dot={{ fill: '#ff6600', r: 3 }}
            activeDot={{ r: 5, fill: '#ff6600' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
