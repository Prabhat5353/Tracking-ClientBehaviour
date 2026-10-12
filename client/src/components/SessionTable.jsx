import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  Clock,
  Layers,
  Copy,
  Check,
  MousePointer,
  Eye,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime, truncateSessionId } from '../utils/formatters';

export default function SessionTable({ sessions, onSelectSession, selectedSessionId, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastActive'); // 'lastActive' | 'totalEvents' | 'firstSeen'
  const [sortOrder, setSortOrder] = useState('desc');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredAndSortedSessions = useMemo(() => {
    let result = [...sessions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => s.sessionId.toLowerCase().includes(term));
    }

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'lastActive' || sortBy === 'firstSeen') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    return result;
  }, [sessions, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
      {/* Table Toolbar */}
      <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Tracked User Sessions</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-blue/15 text-brand-cyan border border-brand-blue/30">
              {filteredAndSortedSessions.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select any session row to inspect its full user journey and event timeline.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by session ID..."
            className="w-full bg-dark-800/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-dark-800/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-5">Session ID</th>
              <th
                className="py-3 px-5 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('totalEvents')}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Total Events</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-5 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('firstSeen')}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>First Seen</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-5 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('lastActive')}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last Active</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && sessions.length === 0 ? (
              // Loading Skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-5">
                    <div className="h-4 bg-white/5 rounded w-48"></div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="h-4 bg-white/5 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="h-4 bg-white/5 rounded w-28"></div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="h-4 bg-white/5 rounded w-28"></div>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="h-4 bg-white/5 rounded w-16 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : filteredAndSortedSessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-slate-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-300">No sessions match your search</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Interact with the demo page to record real tracking events or click the seed button.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedSessions.map((session) => {
                const isSelected = selectedSessionId === session.sessionId;
                return (
                  <tr
                    key={session.sessionId}
                    onClick={() => onSelectSession(session.sessionId)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-brand-blue/15 text-white'
                        : 'hover:bg-white/[0.03] text-slate-300'
                    }`}
                  >
                    {/* Session ID */}
                    <td className="py-3.5 px-5 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isSelected ? 'text-brand-cyan font-bold' : 'text-slate-200'
                          }`}
                        >
                          {session.sessionId}
                        </span>
                        <button
                          onClick={(e) => handleCopy(e, session.sessionId)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-opacity"
                          title="Copy full Session ID"
                        >
                          {copiedId === session.sessionId ? (
                            <Check className="w-3.5 h-3.5 text-brand-emerald" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Total Events & Breakdown */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 bg-dark-700/80 px-2 py-0.5 rounded border border-white/5">
                          {session.totalEvents} events
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          {session.pageViews > 0 && (
                            <span className="flex items-center gap-0.5" title="Page views">
                              <Eye className="w-3 h-3 text-blue-400" />
                              {session.pageViews}
                            </span>
                          )}
                          {session.clicks > 0 && (
                            <span className="flex items-center gap-0.5" title="Clicks">
                              <MousePointer className="w-3 h-3 text-rose-400" />
                              {session.clicks}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* First Seen */}
                    <td className="py-3.5 px-5">
                      <div>
                        <div className="text-slate-200">{formatRelativeTime(session.firstSeen)}</div>
                        <div className="text-[10px] text-slate-500">{formatDateTime(session.firstSeen)}</div>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="py-3.5 px-5">
                      <div>
                        <div className="text-slate-200 font-medium">
                          {formatRelativeTime(session.lastActive)}
                        </div>
                        <div className="text-[10px] text-slate-500">{formatDateTime(session.lastActive)}</div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSession(session.sessionId);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-blue text-white shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>Journey</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
