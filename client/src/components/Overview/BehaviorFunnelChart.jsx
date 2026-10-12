import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Filter, ArrowDown, TrendingDown, CheckCircle2 } from 'lucide-react';

const STAGE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981'];

export default function BehaviorFunnelChart({ funnel = {} }) {
  const steps = funnel.steps || [
    {
      stepOrder: 1,
      name: 'Store Visit',
      sessionsCount: 10,
      conversionRatePercent: 100,
      dropoffRatePercent: 0,
    },
    {
      stepOrder: 2,
      name: 'Product Engagement',
      sessionsCount: 7,
      conversionRatePercent: 70,
      dropoffRatePercent: 30,
    },
    {
      stepOrder: 3,
      name: 'Add to Cart',
      sessionsCount: 4,
      conversionRatePercent: 40,
      dropoffRatePercent: 43,
    },
    {
      stepOrder: 4,
      name: 'Checkout & Order',
      sessionsCount: 2,
      conversionRatePercent: 20,
      dropoffRatePercent: 50,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-dark-800/80 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-sm text-white">Conversion &amp; Drop-off Funnel</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Progressive shopper pipeline from catalog landing to completed transaction
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{funnel.overallConversionRate ?? 20}% Funnel Yield</span>
        </div>
      </div>

      {/* Step by Step Visual Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
        {steps.map((step, idx) => {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Stage 0{step.stepOrder}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STAGE_COLORS[idx % STAGE_COLORS.length] }}
                  />
                </div>
                <div className="font-bold text-white text-sm truncate">{step.name}</div>
                <div className="text-xl font-extrabold text-white mt-1">
                  {step.sessionsCount}{' '}
                  <span className="text-xs font-normal text-slate-400">users</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold">
                  {step.conversionRatePercent}% retained
                </span>
                {idx > 0 && step.dropoffRatePercent > 0 && (
                  <span className="text-rose-400 font-medium flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    {step.dropoffRatePercent}% drop
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal Visual Recharts Bar Visualization */}
      <div className="w-full h-40 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={steps} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              formatter={(val) => [`${val} sessions`, 'Sessions Count']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="sessionsCount" radius={[0, 6, 6, 0]}>
              {steps.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
