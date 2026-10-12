import React from 'react';
import { RefreshCw, Play, Pause, Sparkles, Radio, Globe, ChevronDown } from 'lucide-react';

export default function Topbar({
  activeTab,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  isRefreshing,
  onSeedData,
  isSeeding,
  domains = [],
  selectedSiteId = 'ALL',
  onSelectSiteId,
}) {
  const titles = {
    overview: {
      title: 'Executive Intelligence & Traffic Overview',
      subtitle: 'Real-time telemetry, session volume, and automated conversion drop-off analysis',
    },
    users: {
      title: 'User Interaction & Session Explorer',
      subtitle: 'Complete chronological audit trails, time-on-page metrics, and semantic click badges',
    },
    products: {
      title: 'Product & Interactive Behavior Matrix',
      subtitle: 'Catalog engagement rankings, unique user reach, and conversion tier classifications',
    },
    heatmap: {
      title: 'Visual Heatmap & Click Density Engine',
      subtitle: 'Interactive coordinate density canvas, radial glow mapping, and URL filtering',
    },
    embed: {
      title: 'Universal Website Embed & Installation Hub',
      subtitle: 'Generate tracking tags, view platform integration guides, and monitor connected websites',
    },
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="bg-dark-900/90 backdrop-blur-md border-b border-white/10 px-8 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white tracking-tight">{current.title}</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            LIVE TELEMETRY
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Connected Site Filter Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-dark-950 border border-white/15 px-3 py-1.5 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <select
              value={selectedSiteId}
              onChange={(e) => onSelectSiteId(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-4 appearance-none text-xs"
            >
              <option value="ALL">🌐 All Connected Sites (Global)</option>
              {domains.map((d, idx) => (
                <option key={idx} value={d.siteId || d.domain}>
                  ✦ {d.name} ({d.domain})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-2" />
          </div>
        </div>

        {/* Quick Seed helper */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
          title="Inject realistic multi-user actions into the analytics pipeline"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Simulating...' : 'Simulate Multi-Site Traffic'}</span>
        </button>

        {/* Auto Refresh Toggle */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            autoRefresh
              ? 'bg-brand-500/15 border-brand-500/40 text-brand-300 hover:bg-brand-500/25'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle 5-second automatic polling"
        >
          {autoRefresh ? (
            <>
              <Pause className="w-3.5 h-3.5 text-brand-400" />
              <span>Auto (5s)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-slate-400" />
              <span>Paused</span>
            </>
          )}
        </button>

        {/* Manual Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}
