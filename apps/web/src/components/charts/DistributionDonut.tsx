import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#ff6600', '#20d7ff', '#d8d8d8', '#787878', '#8a3f23', '#296879'];

interface DistributionDonutProps {
  data: { name: string; count: number }[];
  ariaLabel: string;
  accentOffset?: number;
}

export default function DistributionDonut({ data, ariaLabel, accentOffset = 0 }: DistributionDonutProps) {
  const realData = (data || []).filter((item) => item.name && Number(item.count) > 0);
  const total = realData.reduce((sum, item) => sum + Number(item.count), 0);
  const chartData = realData.length ? realData : [{ name: 'No signal', count: 1 }];

  return (
    <div className="distribution-card hud-corners" role="img" aria-label={ariaLabel}>
      <div className="distribution-card__plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={realData.length > 1 ? 3 : 0}
              startAngle={90}
              endAngle={-270}
              strokeWidth={1}
              stroke="#090909"
              isAnimationActive={realData.length > 0}
              animationDuration={850}
            >
              {chartData.map((item, index) => (
                <Cell key={`${item.name}-${index}`} fill={realData.length ? COLORS[(index + accentOffset) % COLORS.length] : '#292929'} />
              ))}
            </Pie>
            {realData.length > 0 && <Tooltip
              contentStyle={{ background:'#080808', border:'1px solid rgba(255,102,0,.45)', borderRadius:0, fontFamily:'Share Tech Mono, monospace', fontSize:9, textTransform:'uppercase' }}
              itemStyle={{ color:'#ddd' }}
              formatter={(value) => [Number(value), 'SESSIONS']}
            />}
          </PieChart>
        </ResponsiveContainer>
        <div className="distribution-card__center"><strong>{total}</strong><span>SIGNALS</span></div>
      </div>
      <div className="distribution-card__legend">
        {realData.length ? realData.slice(0, 4).map((item, index) => (
          <span key={item.name}><i style={{ background: COLORS[(index + accentOffset) % COLORS.length] }} />{item.name}<b>{Math.round((item.count / total) * 100)}%</b></span>
        )) : <span className="is-empty"><i />AWAITING DATA<b>--</b></span>}
      </div>
    </div>
  );
}
