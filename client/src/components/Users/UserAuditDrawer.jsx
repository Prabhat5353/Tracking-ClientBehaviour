import React from 'react';
import {
  X,
  Clock,
  Eye,
  MousePointer,
  Crosshair,
  Compass,
  ShoppingBag,
  CreditCard,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const BADGE_CONFIG = {
  VIEW: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: Eye,
    label: 'PAGE VIEW',
  },
  CLICK_CTA: {
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: MousePointer,
    label: 'CLICK CTA',
  },
  PRODUCT_CLICK: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    icon: Sparkles,
    label: 'PRODUCT VIEW',
  },
  CART_ACTION: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: ShoppingBag,
    label: 'BAG ACTION',
  },
  CHECKOUT_ACTION: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: CreditCard,
    label: 'CHECKOUT INTENT',
  },
  PAYMENT_SELECT: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    icon: CreditCard,
    label: 'PAYMENT SELECT',
  },
  NAVIGATE: {
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    icon: Compass,
    label: 'NAVIGATION',
  },
  FILTER: {
    bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    icon: Layers,
    label: 'FILTER',
  },
};

export default function UserAuditDrawer({ reportData, onClose, isLoading }) {
  if (!reportData && !isLoading) return null;

  const summary = reportData?.summary || {};
  const timeline = reportData?.timeline || [];
  const pagesBreakdown = reportData?.pagesTimeBreakdown || [];

  const formatDelta = (ms) => {
    if (!ms || ms <= 0) return 'Initial';
    const s = (ms / 1000).toFixed(1);
    return `+${s}s`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-xl bg-dark-900 border-l border-white/10 shadow-2xl h-full flex flex-col z-10">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-dark-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Session Audit Report
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                {timeline.length} Signals Captured
              </span>
            </div>
            <h2 className="text-lg font-mono font-bold text-white mt-1 truncate max-w-md">
              {reportData?.sessionId || 'Loading Session...'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-24 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
              Building deep audit replay...
            </div>
          ) : (
            <>
              {/* Session Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-dark-800/80 border border-white/10 text-xs">
                <div>
                  <div className="text-slate-400">Total Duration</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {summary.durationSeconds ?? 0}s
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Page Views</div>
                  <div className="text-base font-bold text-sky-400 mt-0.5">
                    {summary.totalPageViews ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Clicks Made</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {summary.totalClicks ?? 0}
                  </div>
                </div>
              </div>

              {/* Page Time Breakdown */}
              {pagesBreakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Time Spent Per Page
                  </h4>
                  <div className="space-y-2">
                    {pagesBreakdown.map((pb, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[320px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                          <span className="font-mono text-slate-300 truncate">{pb.pageUrl}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-400 font-medium">
                            {pb.eventsCount} events
                          </span>
                          <span className="font-bold text-white bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                            ~{pb.timeSpentSec}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Chronological Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Step-by-Step Interaction Stream
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
                  {timeline.map((event, idx) => {
                    const badge = BADGE_CONFIG[event.actionBadge] || BADGE_CONFIG.CLICK_CTA;
                    const BadgeIcon = badge.icon;
                    const coords = event.coordinates;
                    const meta = event.metadata || {};

                    return (
                      <div key={idx} className="relative group">
                        {/* Dot on line */}
                        <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-dark-900 border-2 border-brand-400 shadow-sm" />

                        <div className="p-4 rounded-xl bg-dark-800/80 border border-white/10 hover:border-white/20 transition-all space-y-2.5">
                          {/* Row 1: Action Badge & Time Delta */}
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}
                            >
                              <BadgeIcon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>

                            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                              <span>{formatTime(event.timestamp)}</span>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                                {formatDelta(event.deltaPrevMs)}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Action Label / Target */}
                          <div className="text-xs font-semibold text-white">
                            {event.actionLabel}
                          </div>

                          {/* Row 3: Target Details & Metadata */}
                          <div className="text-[11px] space-y-1 text-slate-400 bg-dark-900/60 p-2.5 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-slate-400 truncate max-w-[280px]">
                                {event.pageUrl}
                              </span>
                              {coords && (
                                <span className="font-mono text-emerald-400 flex items-center gap-1 shrink-0">
                                  <Crosshair className="w-3 h-3" />
                                  ({coords.x}, {coords.y})
                                </span>
                              )}
                            </div>

                            {meta.productName && (
                              <div className="pt-1 border-t border-white/5 text-slate-200 font-medium flex items-center gap-1.5">
                                <span className="text-indigo-400">Product:</span>
                                <span>{meta.productName}</span>
                              </div>
                            )}

                            {meta.elementTag && (
                              <div className="font-mono text-[10px] text-slate-400 truncate">
                                &lt;{meta.elementTag}&gt;
                                {meta.elementId && ` #${meta.elementId}`}
                                {meta.elementClass && ` .${meta.elementClass.split(' ')[0]}`}
                                {meta.elementText && ` — "${meta.elementText}"`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
