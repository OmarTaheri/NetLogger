import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  data: { date: string; count: number }[];
}

interface ChartDatum {
  date: string;
  count: number;
  trend: number;
}

const DAY_MS = 86_400_000;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeSeries(data: Props['data']): ChartDatum[] {
  const counts = new Map((data || []).map((item) => [item.date.slice(0, 10), Number(item.count) || 0]));
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const series = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(end.getTime() - (13 - index) * DAY_MS);
    return { date: dateKey(date), count: counts.get(dateKey(date)) || 0 };
  });

  return series.map((item, index) => {
    const window = series.slice(Math.max(0, index - 2), index + 1);
    const trend = window.reduce((sum, point) => sum + point.count, 0) / window.length;
    return { ...item, trend: Number(trend.toFixed(2)) };
  });
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function VisitorsOverTimeChart({ data }: Props) {
  const series = normalizeSeries(data);
  const total = series.reduce((sum, point) => sum + point.count, 0);
  const peak = series.reduce((highest, point) => point.count > highest.count ? point : highest, series[0]);
  const average = total / series.length;
  const domainMax = Math.max(4, Math.ceil(Math.max(...series.map((point) => point.count)) * 1.25));
  const hasActivity = total > 0;

  return (
    <section className="analytics-chart-card hud-corners" aria-label="Visitors over the last 14 days">
      <header className="analytics-chart-card__header">
        <div>
          <span>TRAFFIC SIGNAL // 14D</span>
          <h3>Visitors over time</h3>
        </div>
        <div className="analytics-chart-card__metrics">
          <span><small>14D TOTAL</small><strong>{total.toLocaleString()}</strong></span>
          <span><small>DAILY AVG</small><strong>{average.toFixed(1)}</strong></span>
          <span><small>PEAK</small><strong>{peak.count}</strong></span>
        </div>
      </header>

      <div className="analytics-chart-card__plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={series} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="visitorSignalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6600" stopOpacity={0.42} />
                <stop offset="68%" stopColor="#ff6600" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#ff6600" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="rgba(255,255,255,0.075)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#707070', fontSize: 9, fontFamily: 'Share Tech Mono, monospace' }}
              tickFormatter={formatDate}
              interval={2}
              axisLine={{ stroke: 'rgba(255,255,255,.14)' }}
              tickLine={false}
              minTickGap={22}
            />
            <YAxis
              domain={[0, domainMax]}
              tick={{ fill: '#606060', fontSize: 9, fontFamily: 'Share Tech Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: '#20d7ff', strokeWidth: 1, strokeDasharray: '3 4' }}
              contentStyle={{
                background: 'rgba(7,8,7,.96)',
                border: '1px solid rgba(241,90,36,.55)',
                borderRadius: 0,
                boxShadow: '0 14px 45px rgba(0,0,0,.45)',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: 10,
                textTransform: 'uppercase',
              }}
              labelFormatter={(value) => formatDate(String(value))}
              formatter={(value, name) => [name === 'trend' ? Number(value).toFixed(1) : Number(value), name === 'trend' ? '3D AVG' : 'VISITORS']}
              labelStyle={{ color: '#ff6600', marginBottom: 5 }}
            />
            {peak.count > 0 && <ReferenceLine y={peak.count} stroke="rgba(32,215,255,.28)" strokeDasharray="3 7" />}
            <Area
              type="monotone"
              dataKey="count"
              stroke="#ff6600"
              strokeWidth={2.5}
              fill="url(#visitorSignalFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#ff6600', stroke: '#080808', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="#20d7ff"
              strokeWidth={1.2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
              isAnimationActive
              animationDuration={1100}
            />
          </AreaChart>
        </ResponsiveContainer>
        {!hasActivity && <div className="analytics-chart-card__empty"><i /><span>NO TRAFFIC IN THIS WINDOW</span><small>The graph will populate with the next captured visit.</small></div>}
      </div>

      <footer className="analytics-chart-card__legend">
        <span><i /> VISITORS</span>
        <span><i /> 3-DAY SIGNAL AVERAGE</span>
        <b>PEAK // {formatDate(peak.date).toUpperCase()}</b>
      </footer>
    </section>
  );
}
