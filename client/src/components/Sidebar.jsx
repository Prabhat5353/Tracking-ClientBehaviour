import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Flame,
  ExternalLink,
  ShoppingBag,
  Activity,
  Zap,
  Code2,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      subtitle: 'KPIs & traffic streams',
      icon: LayoutDashboard,
      badge: 'Realtime',
    },
    {
      id: 'users',
      label: 'User Interaction Explorer',
      subtitle: 'Audit sessions & journeys',
      icon: Users,
    },
    {
      id: 'products',
      label: 'Product Behavior Matrix',
      subtitle: 'CTA engagement & reach',
      icon: Layers,
    },
    {
      id: 'heatmap',
      label: 'Visual Heatmap & Density',
      subtitle: 'Radial coordinate glow',
      icon: Flame,
    },
    {
      id: 'embed',
      label: 'Website Embed Hub',
      subtitle: 'Universal install & guides',
      icon: Code2,
      badge: 'Any Site',
    },
  ];

  return (
    <aside className="w-72 bg-dark-900 border-r border-white/10 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">
              Lumina
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Command Centre</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Intelligence Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-brand-600/15 border border-brand-500/40 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                      : 'bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                </div>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Access Store & Links Footer */}
      <div className="p-4 border-t border-white/10 space-y-2 bg-dark-950/40">
        <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Connected Properties
        </div>
        <a
          href="/store/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 hover:text-white transition-all group"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>LUMINA Storefront</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </a>

        <a
          href="/demo/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 hover:text-white transition-all group"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>SaaS Sandbox Demo</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </a>

        <a
          href="/external/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 hover:text-white transition-all group"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>NovaCloud AI (External)</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </a>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>Engine v2.4 Enterprise</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
}
