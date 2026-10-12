import React from 'react';
import { Activity, Flame, Users, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  isRefreshing,
}) {
  return (
    <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-white/10 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-indigo flex items-center justify-center shadow-lg shadow-brand-blue/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">CausalFunnel Analytics</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400">E-Commerce User Behavior &amp; Session Tracking Platform</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-dark-800/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sessions'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sessions Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Heatmap Visualizer</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${
                autoRefresh ? 'bg-brand-blue' : 'bg-dark-700'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                  autoRefresh ? 'left-4' : 'left-0.5'
                }`}
              />
            </div>
            <span>Auto (5s)</span>
          </label>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white border border-white/10 transition-all disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-blue' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Open Demo Page Link */}
          <a
            href="http://localhost:5000/demo/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-indigo/20 to-brand-blue/20 hover:from-brand-indigo/30 hover:to-brand-blue/30 text-xs font-semibold text-brand-cyan border border-brand-blue/30 transition-all"
            title="Open demo landing page to generate live clicks & pageviews"
          >
            <span>Live Demo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
