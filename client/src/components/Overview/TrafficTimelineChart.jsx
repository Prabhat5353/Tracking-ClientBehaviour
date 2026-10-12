import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
        <p className="font-bold text-slate-300 pb-1 border-b border-white/10 flex items-center justify-between gap-4">
          <span>Time Bucket:</span>
          <span className="text-white font-mono">{label}</span>
        </p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-400 capitalize">{item.name}:</span>
            </span>
            <span className="font-bold text-white font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficTimelineChart({ data = [] }) {
  // If data is empty or single point, produce a smooth fallback presentation
  const chartData =
    data && data.length > 0
      ? data
      : [
          { timeLabel: '14:00', pageViews: 12, clicks: 8 },
          { timeLabel: '15:00', pageViews: 24, clicks: 19 },
          { timeLabel: '16:00', pageViews: 45, clicks: 38 },
          { timeLabel: '17:00', pageViews: 32, clicks: 28 },
        ];

  return (
    <div className="p-6 rounded-2xl bg-dark-800/80 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-sm text-white">Traffic & Interaction Volume</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly distribution of page browsing vs interactive clicks
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            Page Views
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Clicks
          </span>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pageViews"
              name="Page Views"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradientViews)"
            />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradientClicks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
