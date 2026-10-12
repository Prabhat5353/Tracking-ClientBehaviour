import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { MousePointer, Award } from 'lucide-react';

const DONUT_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899'];

export default function TopElementsDonut({ items = [] }) {
  const topList = (items && items.length > 0 ? items.slice(0, 5) : [
    { name: 'Apex Wireless Studio Headphones', totalClicks: 14 },
    { name: 'Add to Cart', totalClicks: 9 },
    { name: 'Proceed to Checkout', totalClicks: 6 },
    { name: 'Studio Audio Filter', totalClicks: 4 },
    { name: 'Complete Order & Pay', totalClicks: 3 },
  ]);

  const totalClicksSum = topList.reduce((acc, curr) => acc + (curr.totalClicks || 0), 0) || 1;

  const chartData = topList.map((item) => ({
    name: item.name,
    value: item.totalClicks || 1,
  }));

  return (
    <div className="p-6 rounded-2xl bg-dark-800/80 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Top Interactive Elements</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Most clicked items, product quick-views and conversion buttons
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="md:col-span-5 h-48 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Pie
                data={chartData}
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-white">{totalClicksSum}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Clicks
            </span>
          </div>
        </div>

        {/* Leaderboard list */}
        <div className="md:col-span-7 space-y-2.5">
          {topList.map((item, idx) => {
            const pct = Math.round(((item.totalClicks || 0) / totalClicksSum) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 truncate text-slate-300 font-medium">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="truncate max-w-[200px]" title={item.name}>
                      {item.name}
                    </span>
                  </span>
                  <span className="font-bold text-white shrink-0 ml-2">
                    {item.totalClicks} <span className="text-slate-400 font-normal">({pct}%)</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
