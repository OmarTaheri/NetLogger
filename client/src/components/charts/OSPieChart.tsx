import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: { name: string; count: number }[];
}

const COLORS = ['#4285f4', '#ff6600', '#0f9d58', '#f4b400', '#ea4335', '#9c27b0'];

export default function OSPieChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="hud-corners bg-hud-surface/50 border border-hud-border p-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            strokeWidth={1}
            stroke="#1a1a2e"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,102,0,0.3)',
              fontFamily: 'monospace',
              fontSize: 11,
              textTransform: 'uppercase',
            }}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
