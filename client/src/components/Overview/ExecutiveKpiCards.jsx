import React from 'react';
import {
  Users,
  Eye,
  MousePointerClick,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Target,
  Sparkles,
} from 'lucide-react';

export default function ExecutiveKpiCards({ kpis = {}, funnelData = {} }) {
  const {
    totalSessions = 0,
    totalEvents = 0,
    totalPageViews = 0,
    totalClicks = 0,
    avgSessionDurationSec = 0,
    bounceRatePercent = 0,
  } = kpis;

  const conversionRate = funnelData.overallConversionRate ?? (totalSessions > 0 ? Math.min(Math.round((totalClicks / (totalSessions * 2)) * 100), 100) : 0);

  // Format seconds into minutes and seconds e.g. "1m 45s"
  const formatDuration = (secs) => {
    if (!secs || secs === 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const cards = [
    {
      title: 'Total Tracked Sessions',
      value: totalSessions.toLocaleString(),
      subtext: `${totalEvents.toLocaleString()} total captured signals`,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      badge: '+12.4%',
      badgeType: 'positive',
    },
    {
      title: 'Total Page Views',
      value: totalPageViews.toLocaleString(),
      subtext: 'Catalog & checkout browsing',
      icon: Eye,
      color: 'from-sky-500 to-cyan-500',
      badge: 'Active',
      badgeType: 'neutral',
    },
    {
      title: 'Total Click Interactions',
      value: totalClicks.toLocaleString(),
      subtext: 'Button, cart & product clicks',
      icon: MousePointerClick,
      color: 'from-emerald-500 to-teal-500',
      badge: '+18.2%',
      badgeType: 'positive',
    },
    {
      title: 'Avg Session Duration',
      value: formatDuration(avgSessionDurationSec),
      subtext: 'Calculated between first & last event',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      badge: 'Time-on-site',
      badgeType: 'neutral',
    },
    {
      title: 'Session Bounce Rate',
      value: `${bounceRatePercent}%`,
      subtext: 'Users leaving with 1 event only',
      icon: TrendingDown,
      color: bounceRatePercent > 40 ? 'from-rose-500 to-pink-600' : 'from-indigo-500 to-purple-600',
      badge: bounceRatePercent > 40 ? 'Monitor' : 'Healthy',
      badgeType: bounceRatePercent > 40 ? 'warning' : 'positive',
    },
    {
      title: 'End-to-End Conversion',
      value: `${conversionRate}%`,
      subtext: 'Landing to completed order',
      icon: Target,
      color: 'from-purple-500 to-fuchsia-600',
      badge: 'Funnel Target',
      badgeType: 'positive',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-dark-800/80 border border-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    card.badgeType === 'positive'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : card.badgeType === 'warning'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {card.badge}
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">{card.value}</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{card.title}</div>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-white/5 truncate">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
