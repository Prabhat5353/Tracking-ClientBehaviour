import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  MousePointer,
  Award,
  Filter,
} from 'lucide-react';

export default function ProductMatrixTable({ data = {}, isLoading }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const items = data.items || [];
  const totalInteractions = data.totalInteractions || items.reduce((acc, i) => acc + i.totalClicks, 0);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === 'ALL' || item.engagementTier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [items, search, tierFilter]);

  const highTierCount = items.filter((i) => i.engagementTier === 'High').length;
  const topItem = items.length > 0 ? items[0] : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Tracked Catalog Items</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white">{items.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Products &amp; critical interactive CTAs</div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Interactions</span>
            <MousePointer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalInteractions}</div>
          <div className="text-[11px] text-slate-400 mt-1">Aggregated click signals captured</div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>High Engagement Items</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{highTierCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">&gt;40% interaction rate or &ge;6 clicks</div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Top Velocity Item</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white truncate mt-1">
            {topItem ? topItem.name : '—'}
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-semibold">
            {topItem ? `${topItem.totalClicks} clicks captured` : 'Waiting for telemetry'}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-dark-800/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Product &amp; Action Performance Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked breakdown of shopper attention, click frequency, and reach across catalog products
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product or button..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-dark-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 w-56 transition-all"
              />
            </div>

            {/* Filter by Tier */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 bg-dark-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Engagement Tiers</option>
              <option value="High">High Engagement</option>
              <option value="Medium">Medium Engagement</option>
              <option value="Low">Low Engagement</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Product / UI Element</th>
                <th className="py-3 px-6">Interaction Type</th>
                <th className="py-3 px-6">Total Clicks</th>
                <th className="py-3 px-6">Unique Users</th>
                <th className="py-3 px-6">Traffic Reach</th>
                <th className="py-3 px-6">Engagement Tier</th>
                <th className="py-3 px-6 text-right">Last Interaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Calculating product interaction telemetry...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No items recorded for this filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const maxClicks = items[0]?.totalClicks || 1;
                  const clickPct = Math.round((item.totalClicks / maxClicks) * 100);

                  return (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs text-brand-400 border border-white/10 shrink-0">
                            {idx + 1}
                          </div>
                          <span className="truncate max-w-[240px]" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                          {item.actionType || (item.productId ? 'PRODUCT' : 'CTA')}
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="space-y-1">
                          <span className="font-bold text-white font-mono">
                            {item.totalClicks}
                          </span>
                          <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${clickPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.uniqueUsers} users</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <span className="font-bold text-emerald-400 font-mono">
                          {item.interactionRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.engagementTier === 'High'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.engagementTier === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {item.engagementTier}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right font-mono text-slate-400">
                        {formatDate(item.lastClicked)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
