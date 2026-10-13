import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Clock,
  Layers,
  MousePointer,
  Eye,
  Filter,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function UserInteractionTable({
  sessions = [],
  onSelectSession,
  selectedSessionId,
  isLoading,
}) {
  const [search, setSearch] = useState('');
  const [filterPage, setFilterPage] = useState('ALL');

  // Format seconds to "1m 20s"
  const formatDuration = (secs) => {
    if (!secs || secs === 0) return '< 1s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Format relative time / date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const term = search.toLowerCase();
      const matchSearch =
        s.sessionId.toLowerCase().includes(term) ||
        (s.initialPage && s.initialPage.toLowerCase().includes(term)) ||
        (s.userName && s.userName.toLowerCase().includes(term)) ||
        (s.userEmail && s.userEmail.toLowerCase().includes(term));

      const matchPage =
        filterPage === 'ALL' || (s.initialPage && s.initialPage.includes(filterPage));

      return matchSearch && matchPage;
    });
  }, [sessions, search, filterPage]);

  return (
    <div className="bg-dark-800/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg">
      {/* Header & Filter Controls */}
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Tracked User Sessions &amp; Journeys</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select any visitor session to inspect chronological step-by-step actions and telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search session ID or page..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-dark-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 w-56 transition-all"
            />
          </div>

          {/* Filter dropdown */}
          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            className="px-3 py-1.5 bg-dark-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Landing Pages</option>
            <option value="/store">Store Catalog</option>
            <option value="/checkout">Checkout Page</option>
            <option value="/demo">SaaS Sandbox</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">User / Session</th>
              <th className="py-3 px-6">Initial Landing Page</th>
              <th className="py-3 px-6">Duration</th>
              <th className="py-3 px-6">Total Events</th>
              <th className="py-3 px-6">Views / Clicks</th>
              <th className="py-3 px-6">Last Active</th>
              <th className="py-3 px-6 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Loading session records...
                </td>
              </tr>
            ) : filteredSessions.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  No session matching current filters.
                </td>
              </tr>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = selectedSessionId === s.sessionId;
                const isBounce = (s.totalEvents || s.eventCount || 0) === 1;

                return (
                  <tr
                    key={s.sessionId}
                    onClick={() => onSelectSession(s.sessionId)}
                    className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-600/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar / Identity indicator */}
                        {s.userName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {s.userName.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-semibold text-xs truncate max-w-[110px]">{s.userName}</span>
                              <span className="text-slate-500 text-[10px] truncate max-w-[110px]">{s.userEmail || s.sessionId.substring(0,14) + '…'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isBounce ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-slate-300 text-[11px] truncate max-w-[130px]">{s.sessionId}</span>
                              <span className="text-slate-600 text-[10px]">Anonymous visitor</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[11px] text-slate-300">
                        {s.initialPage || '/store/index.html'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDuration(s.durationSeconds)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-white">{s.totalEvents || s.eventCount}</span>
                      {isBounce && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Bounced
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sky-400">
                          <Eye className="w-3 h-3" />
                          <span>{s.pageViews ?? '—'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <MousePointer className="w-3 h-3" />
                          <span>{s.clicks ?? '—'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {formatDate(s.lastActive || s.firstSeen)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSession(s.sessionId);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-brand-300 hover:text-white'
                        }`}
                      >
                        <span>Audit</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 bg-dark-900/40 text-xs text-slate-400 flex items-center justify-between">
        <span>Showing {filteredSessions.length} session streams</span>
        <span>Click any row to open the Step-by-Step User Journey Drawer</span>
      </div>
    </div>
  );
}
