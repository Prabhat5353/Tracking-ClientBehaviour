import React from 'react';
import { Users, MousePointerClick, Eye, BarChart3, TrendingUp } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const {
    totalSessions = 0,
    totalEvents = 0,
    totalClicks = 0,
    totalPageViews = 0,
    avgEventsPerSession = 0,
  } = stats || {};

  const clickRate = totalEvents > 0 ? Math.round((totalClicks / totalEvents) * 100) : 0;

  const cards = [
    {
      title: 'Total Sessions',
      value: totalSessions.toLocaleString(),
      subtitle: 'Unique client session IDs',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Active Tracking',
    },
    {
      title: 'Ingested Events',
      value: totalEvents.toLocaleString(),
      subtitle: `${totalPageViews.toLocaleString()} page views`,
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-600',
      badge: 'High Velocity',
    },
    {
      title: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      subtitle: `${clickRate}% of total activity`,
      icon: MousePointerClick,
      color: 'from-rose-500 to-orange-500',
      badge: 'Coordinates Captured',
    },
    {
      title: 'Avg Events / Session',
      value: avgEventsPerSession,
      subtitle: 'Engagement depth metric',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      badge: 'User Stickiness',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group"
          >
            {/* Ambient accent top border */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-70`}
            />

            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-[11px] text-slate-400">{card.subtitle}</span>
              <span className="text-[10px] font-semibold text-slate-400/80 bg-white/5 px-2 py-0.5 rounded-full">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
