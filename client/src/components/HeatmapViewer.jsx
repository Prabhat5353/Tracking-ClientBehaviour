import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Globe,
  Sliders,
  Maximize2,
  MousePointer,
  RefreshCw,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { api } from '../api/client';
import { formatDateTime } from '../utils/formatters';

export default function HeatmapViewer({ pages = [], onRefresh, isRefreshing }) {
  const [selectedUrl, setSelectedUrl] = useState(pages[0] || '/demo/index.html');
  const [clickData, setClickData] = useState({ totalClicks: 0, points: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Customization controls
  const [radius, setRadius] = useState(25);
  const [opacity, setOpacity] = useState(0.65);
  const [colorScheme, setColorScheme] = useState('fire'); // 'fire' | 'emerald' | 'cyan'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Dimensions of mock viewport
  const VIEWPORT_WIDTH = 1200;
  const VIEWPORT_HEIGHT = 800;

  // When pages list changes, set selectedUrl if not set
  useEffect(() => {
    if (pages.length > 0 && !selectedUrl) {
      setSelectedUrl(pages[0]);
    }
  }, [pages, selectedUrl]);

  // Fetch click data when selectedUrl changes
  useEffect(() => {
    let isMounted = true;
    async function loadClicks() {
      setIsLoading(true);
      try {
        const res = await api.getClicks(selectedUrl);
        if (isMounted) {
          setClickData({
            totalClicks: res.totalClicks || 0,
            points: res.points || [],
          });
        }
      } catch (err) {
        console.error('Failed to load clicks for heatmap:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadClicks();
    return () => {
      isMounted = false;
    };
  }, [selectedUrl]);

  // Render heatmap canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!clickData.points || clickData.points.length === 0) return;

    // Set blend mode for natural additive heat glow
    ctx.globalCompositeOperation = 'screen';

    clickData.points.forEach((pt) => {
      const x = Math.min(Math.max(pt.x, 0), VIEWPORT_WIDTH);
      const y = Math.min(Math.max(pt.y, 0), VIEWPORT_HEIGHT);

      const rad = radius;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, rad);

      if (colorScheme === 'fire') {
        gradient.addColorStop(0, `rgba(255, 69, 0, ${opacity})`);
        gradient.addColorStop(0.3, `rgba(255, 140, 0, ${opacity * 0.7})`);
        gradient.addColorStop(0.7, `rgba(255, 215, 0, ${opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      } else if (colorScheme === 'cyan') {
        gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity})`);
        gradient.addColorStop(0.4, `rgba(59, 130, 246, ${opacity * 0.7})`);
        gradient.addColorStop(0.8, `rgba(147, 51, 234, ${opacity * 0.25})`);
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
      } else {
        gradient.addColorStop(0, `rgba(16, 185, 129, ${opacity})`);
        gradient.addColorStop(0.4, `rgba(52, 211, 153, ${opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [clickData, radius, opacity, colorScheme]);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* URL Selector & Page Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Select Tracked Page URL</span>
              <div className="relative mt-1">
                <select
                  value={selectedUrl}
                  onChange={(e) => setSelectedUrl(e.target.value)}
                  className="bg-dark-800 border border-white/10 text-white text-xs font-mono rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-brand-blue cursor-pointer"
                >
                  <option value="">All Tracked Pages (Global Heatmap)</option>
                  {pages.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-dark-800/80 px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Captured Clicks</span>
              <span className="text-base font-extrabold text-white">
                {clickData.totalClicks.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="text-slate-400 text-[11px] block">Coordinates</span>
              <span className="text-xs font-semibold text-brand-emerald">Document X, Y</span>
            </div>
          </div>
        </div>

        {/* Customization Sliders */}
        <div className="flex flex-wrap items-center gap-4 bg-dark-800/60 p-2.5 rounded-xl border border-white/5 text-xs">
          {/* Radius Slider */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Radius:</span>
            <input
              type="range"
              min="10"
              max="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-20 accent-brand-blue cursor-pointer"
            />
            <span className="text-slate-300 font-mono text-[10px] w-6">{radius}px</span>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Intensity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-20 accent-brand-blue cursor-pointer"
            />
            <span className="text-slate-300 font-mono text-[10px] w-8">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          {/* Glow Color Mode */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setColorScheme('fire')}
              className={`w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 transition-transform ${
                colorScheme === 'fire' ? 'ring-2 ring-white scale-110' : 'opacity-60'
              }`}
              title="Thermal Fire Glow"
            />
            <button
              onClick={() => setColorScheme('cyan')}
              className={`w-5 h-5 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-blue transition-transform ${
                colorScheme === 'cyan' ? 'ring-2 ring-white scale-110' : 'opacity-60'
              }`}
              title="Cyber Neon Cyan Glow"
            />
            <button
              onClick={() => setColorScheme('emerald')}
              className={`w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 transition-transform ${
                colorScheme === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60'
              }`}
              title="Emerald Matrix Glow"
            />
          </div>
        </div>
      </div>

      {/* Mock Viewport & Canvas Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Mock Browser Header Bar */}
        <div className="bg-dark-800/90 px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 text-[11px] font-mono text-slate-400">
              Viewport Simulation: {VIEWPORT_WIDTH} × {VIEWPORT_HEIGHT}px
            </span>
          </div>

          {/* Mock URL Address Bar */}
          <div className="bg-dark-900/90 px-4 py-1 rounded-lg border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2 max-w-md w-full justify-center">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">http://localhost:5000</span>
            <span className="text-brand-cyan font-bold">{selectedUrl || '/demo/index.html'}</span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            {isLoading ? 'Loading click points...' : `${clickData.points.length} click points rendered`}
          </div>
        </div>

        {/* Viewport Canvas Wrapper */}
        <div
          ref={containerRef}
          className="relative overflow-x-auto bg-[#0a0e17] flex justify-center p-4 min-h-[600px]"
        >
          {/* Mock Website Canvas Preview Underlay */}
          <div
            className="relative border border-white/10 rounded-xl overflow-hidden bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 shadow-2xl"
            style={{ width: `${VIEWPORT_WIDTH}px`, height: `${VIEWPORT_HEIGHT}px` }}
          >
            {/* Mock Page Background Elements to visualize where clicks land */}
            <div className="absolute inset-0 p-8 pointer-events-none select-none opacity-40">
              {/* Mock Navbar */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-8">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-500"></div> AuraCloud
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Features</span>
                  <span>Pricing</span>
                  <span>Docs</span>
                </div>
                <div className="w-16 h-6 rounded bg-blue-600/50"></div>
              </div>

              {/* Mock Hero */}
              <div className="text-center py-10 max-w-lg mx-auto">
                <div className="w-24 h-4 rounded-full bg-cyan-500/20 mx-auto mb-4"></div>
                <div className="h-8 bg-white/20 rounded-lg mb-3"></div>
                <div className="h-4 bg-white/10 rounded max-w-sm mx-auto mb-6"></div>
                <div className="flex justify-center gap-3">
                  <div className="w-28 h-8 rounded-lg bg-blue-500/40"></div>
                  <div className="w-24 h-8 rounded-lg bg-white/10"></div>
                </div>
              </div>

              {/* Mock Feature / Pricing Cards */}
              <div className="grid grid-cols-3 gap-6 pt-12">
                <div className="h-48 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded bg-blue-500/20"></div>
                  <div className="w-full h-8 rounded bg-white/10"></div>
                </div>
                <div className="h-48 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded bg-purple-500/20"></div>
                  <div className="w-full h-8 rounded bg-blue-500/30"></div>
                </div>
                <div className="h-48 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded bg-emerald-500/20"></div>
                  <div className="w-full h-8 rounded bg-white/10"></div>
                </div>
              </div>
            </div>

            {/* Heatmap Overlay Canvas */}
            <canvas
              ref={canvasRef}
              width={VIEWPORT_WIDTH}
              height={VIEWPORT_HEIGHT}
              className="absolute inset-0 cursor-crosshair z-10"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const scaleX = VIEWPORT_WIDTH / rect.width;
                const scaleY = VIEWPORT_HEIGHT / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                // Find closest click point within 30px
                const closest = clickData.points.find((pt) => {
                  const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
                  return dist < 30;
                });
                setHoveredPoint(closest || null);
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* Tooltip on hovering click cluster */}
            {hoveredPoint && (
              <div
                className="absolute z-20 pointer-events-none bg-dark-900/95 border border-white/20 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl backdrop-blur-md -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${hoveredPoint.x}px`,
                  top: `${hoveredPoint.y - 12}px`,
                }}
              >
                <div className="font-bold text-brand-cyan">Click Point Detected</div>
                <div>X: {hoveredPoint.x}px, Y: {hoveredPoint.y}px</div>
                <div className="text-slate-400 text-[10px]">{formatDateTime(hoveredPoint.timestamp)}</div>
              </div>
            )}

            {/* Empty state overlay */}
            {clickData.points.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 bg-dark-900/60 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <MousePointer className="w-6 h-6 text-slate-500" />
                </div>
                <p className="font-semibold text-slate-200">No clicks recorded for this URL yet</p>
                <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                  Open the demo page at <code className="text-brand-cyan">http://localhost:5000{selectedUrl}</code> and click around to generate real-time heatmap dots.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
