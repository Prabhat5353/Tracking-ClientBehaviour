import React, { useEffect } from 'react';
import {
  X,
  Eye,
  MousePointerClick,
  Clock,
  Layers,
  MapPin,
  Calendar,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime, formatDuration } from '../utils/formatters';

export default function SessionDrawer({ sessionData, onClose, isLoading }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sessionData && !isLoading) return null;

  const { sessionId, summary, events = [] } = sessionData || {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-dark-900 border-l border-white/10 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-dark-800/60 backdrop-blur-md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan bg-brand-blue/15 px-2.5 py-0.5 rounded-full border border-brand-blue/30">
                User Journey Reconstruction
              </span>
              <h2 className="text-lg font-bold text-white font-mono mt-2 break-all">
                {sessionId}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Pill Ribbon */}
          {summary && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
              <div className="bg-dark-900/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block mb-0.5">Total Steps</span>
                <span className="text-base font-extrabold text-white">
                  {summary.totalEvents}
                </span>
              </div>
              <div className="bg-dark-900/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block mb-0.5">Duration</span>
                <span className="text-base font-extrabold text-brand-emerald">
                  {formatDuration(summary.durationMs)}
                </span>
              </div>
              <div className="bg-dark-900/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block mb-0.5">Last Active</span>
                <span className="text-xs font-semibold text-slate-300">
                  {formatRelativeTime(summary.lastActive)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs">Reconstructing session timeline...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No events found for this session.
            </div>
          ) : (
            <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-brand-blue before:via-brand-indigo before:to-dark-700">
              {events.map((event, index) => {
                const isPageView = event.eventType === 'page_view';
                const prevEvent = index > 0 ? events[index - 1] : null;
                const deltaMs = prevEvent
                  ? new Date(event.timestamp).getTime() - new Date(prevEvent.timestamp).getTime()
                  : 0;

                return (
                  <div key={event._id || index} className="relative mb-6 last:mb-0 group">
                    {/* Timeline Node Marker */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isPageView
                          ? 'border-brand-blue bg-dark-900 text-brand-blue shadow-lg shadow-brand-blue/30'
                          : 'border-rose-500 bg-dark-900 text-rose-400 shadow-lg shadow-rose-500/30'
                      }`}
                    >
                      {isPageView ? (
                        <Eye className="w-2.5 h-2.5" />
                      ) : (
                        <MousePointerClick className="w-2.5 h-2.5" />
                      )}
                    </div>

                    {/* Step Card */}
                    <div className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/15 transition-all">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isPageView
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isPageView ? 'Page View' : 'Click Interaction'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Step #{index + 1}
                          </span>
                        </div>

                        {index > 0 && deltaMs > 0 && (
                          <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            +{formatDuration(deltaMs)}
                          </span>
                        )}
                      </div>

                      {/* URL */}
                      <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5 my-1 font-mono break-all">
                        <span className="text-slate-500">URL:</span>
                        <span className="text-brand-cyan">{event.pageUrl}</span>
                      </div>

                      {/* Coordinates (for click events) */}
                      {!isPageView && event.coordinates && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            Document Coordinates:
                          </span>
                          <span className="font-mono font-semibold text-white bg-dark-700/80 px-2 py-0.5 rounded">
                            X: {event.coordinates.x}px, Y: {event.coordinates.y}px
                          </span>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{formatDateTime(event.timestamp)}</span>
                        <span>{formatRelativeTime(event.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-dark-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>End of User Journey sequence</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
