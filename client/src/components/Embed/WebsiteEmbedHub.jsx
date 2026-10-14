import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Terminal,
  Activity,
  ArrowRight,
  Server,
  FileCode2,
} from 'lucide-react';
import { api } from '../../api/client';

export default function WebsiteEmbedHub({ domains = [], onRefresh }) {
  const [siteId, setSiteId] = useState('my-external-website');
  const [scriptUrl, setScriptUrl] = useState('http://localhost:5000/tracker/tracker.js');
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState('html');
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Computed Embed Snippet
  const embedCode = `<!-- Lumina Universal User Analytics & Session Tracker -->
<script
  src="${scriptUrl}"
  data-site-id="${siteId.trim() || 'my-website'}"
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Live test beacon sender
  const handleTestBeacon = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const testSessionId = `sess_test_ext_${Date.now().toString(36)}`;
      const res = await api.trackEvent({
        sessionId: testSessionId,
        eventType: 'page_view',
        pageUrl: '/external-verification-test',
        metadata: {
          domain: siteId.includes('.') ? siteId : `${siteId}.example.com`,
          siteId: siteId.trim() || 'my-website',
          title: 'External Embed Verification Ping',
          actionType: 'VIEW',
          elementText: 'Diagnostics Verification Ping',
        },
      });

      setTestStatus({
        success: true,
        message: `Signal ingested successfully (HTTP 201 Created)! Session ${testSessionId} recorded under site "${siteId}".`,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setTestStatus({
        success: false,
        message: 'Failed to dispatch test signal. Ensure backend server is running.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const platforms = [
    { id: 'html', name: 'HTML / Static Sites', icon: FileCode2 },
    { id: 'shopify', name: 'Shopify Liquid', icon: Zap },
    { id: 'nextjs', name: 'Next.js / React', icon: Code2 },
    { id: 'wordpress', name: 'WordPress / Woo', icon: Globe },
    { id: 'webflow', name: 'Webflow / Wix', icon: Layers },
    { id: 'api', name: 'SPA JavaScript API', icon: Terminal },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900/40 via-dark-800 to-indigo-950/40 border border-brand-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Universal Third-Party Website Tracking</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You can install Lumina Analytics on <strong>any website or client web app</strong>. Simply paste the lightweight (<strong className="text-brand-300">&lt; 5KB</strong>) snippet before the closing <code className="text-brand-400 font-mono bg-dark-900 px-1.5 py-0.5 rounded">&lt;/head&gt;</code> tag. It runs non-blockingly, works cross-origin, and captures complete sessions, click coordinates, and conversions automatically.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <a
            href="/external/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-md group"
          >
            <span>Preview External Client Site</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Snippet Generator Card */}
      <div className="bg-dark-800/80 rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Generate Your Universal Tracking Snippet</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Customize the site identifier so incoming traffic is partitioned automatically in your Command Centre.
          </p>
        </div>

        {/* Configuration Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Site Identifier (<code className="text-brand-400 font-mono">data-site-id</code>)
            </label>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="e.g. acme-ecommerce, client-saas"
              className="w-full px-4 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-brand-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used in the Topbar filter dropdown to view this specific website's analytics.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tracker Script Source URL
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="http://localhost:5000/tracker/tracker.js"
              className="w-full px-4 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-brand-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Hosted script URL served from your backend or CDN.
            </p>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-dark-950 font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2.5 bg-dark-900/90 border-b border-white/10 text-slate-400 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-medium">Embed Snippet (Ready to Paste)</span>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 text-emerald-400 overflow-x-auto leading-relaxed select-all">
            {embedCode}
          </pre>
        </div>

        {/* Technical Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Zero Third-Party Dependencies</div>
              <div className="text-[11px] text-slate-400">Pure vanilla JavaScript (&lt; 5KB)</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Async &amp; Non-Blocking</div>
              <div className="text-[11px] text-slate-400">Zero impact on host site render velocity</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs">
            <Server className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Full CORS &amp; Beacon Safe</div>
              <div className="text-[11px] text-slate-400">Exit signals delivered via navigator.sendBeacon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform-Specific Integration Guides */}
      <div className="bg-dark-800/80 rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white">Platform-Specific Installation Guides</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step instructions for embedding on popular e-commerce, CMS, and frontend frameworks.
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isActive = activePlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-4 rounded-xl bg-dark-900 border border-white/5 text-xs text-slate-300 space-y-3">
          {activePlatform === 'html' && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">HTML / Static Websites</h4>
              <p>Paste the snippet directly inside your HTML document's <code className="text-brand-400 font-mono">&lt;head&gt;</code> element, just before the closing <code className="text-brand-400 font-mono">&lt;/head&gt;</code> tag:</p>
              <pre className="p-3 bg-dark-950 rounded-lg font-mono text-emerald-400 overflow-x-auto">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Website</title>
  <!-- Paste Lumina Tracking Script Here -->
  <script src="${scriptUrl}" data-site-id="${siteId}" async></script>
</head>
<body>...</body>
</html>`}
              </pre>
            </div>
          )}

          {activePlatform === 'shopify' && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Shopify Liquid Themes</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                <li>Log in to your <strong>Shopify Admin</strong> &gt; <strong>Online Store</strong> &gt; <strong>Themes</strong>.</li>
                <li>Click <strong>Actions (...)</strong> &gt; <strong>Edit code</strong>.</li>
                <li>Open the <code className="text-brand-400 font-mono">Layout/theme.liquid</code> file.</li>
                <li>Scroll down to the closing <code className="text-brand-400 font-mono">&lt;/head&gt;</code> tag and paste the snippet directly above it.</li>
                <li>Click <strong>Save</strong>. All store visits, product clicks, and cart actions will be tracked automatically!</li>
              </ol>
            </div>
          )}

          {activePlatform === 'nextjs' && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Next.js (App Router &amp; Pages Router)</h4>
              <p>In your root layout (<code className="text-brand-400 font-mono">app/layout.jsx</code> or <code className="text-brand-400 font-mono">app/layout.tsx</code>), import the Next.js Script component:</p>
              <pre className="p-3 bg-dark-950 rounded-lg font-mono text-emerald-400 overflow-x-auto">
{`import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="${scriptUrl}"
          data-site-id="${siteId}"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`}
              </pre>
            </div>
          )}

          {activePlatform === 'wordpress' && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">WordPress &amp; WooCommerce</h4>
              <p>Option A: Install the free <strong>WPCode / Insert Headers and Footers</strong> plugin and paste the snippet into the <em>Header</em> box.</p>
              <p>Option B: Add to your active child theme's <code className="text-brand-400 font-mono">functions.php</code>:</p>
              <pre className="p-3 bg-dark-950 rounded-lg font-mono text-emerald-400 overflow-x-auto">
{`add_action('wp_head', function() {
  ?>
  <script src="${scriptUrl}" data-site-id="${siteId}" async></script>
  <?php
});`}
              </pre>
            </div>
          )}

          {activePlatform === 'webflow' && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Webflow, Squarespace &amp; Wix</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                <li>In your <strong>Webflow Project Settings</strong>, navigate to the <strong>Custom Code</strong> tab.</li>
                <li>Under the <strong>Head Code</strong> field, paste your tracking snippet.</li>
                <li>Click <strong>Save Changes</strong> and <strong>Publish</strong> your site to production.</li>
              </ol>
            </div>
          )}

          {activePlatform === 'api' && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Programmatic JavaScript API (<code className="text-brand-400 font-mono">window.CFAnalytics</code>)</h4>
              <p>Once embedded, the tracker exposes a global helper for Single-Page Apps (React, Vue, Svelte) to track custom conversions:</p>
              <pre className="p-3 bg-dark-950 rounded-lg font-mono text-cyan-400 overflow-x-auto">
{`// 1. Programmatically record a custom conversion or checkout action
window.CFAnalytics.track('PURCHASE_COMPLETED', {
  productId: 'prod_enterprise_ai',
  productName: 'Enterprise AI Suite',
  revenue: 499.00
});

// 2. Track route change on Single-Page Applications
window.CFAnalytics.pageView('/dashboard/reports');

// 3. Inspect active session ID
const currentSessionId = window.CFAnalytics.getSessionId();`}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Live Ingestion Diagnostics & Connected Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Ping Tester */}
        <div className="bg-dark-800/80 rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Live Cross-Domain Embed Diagnostics</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify that external websites can reach and ingest events into your Lumina server.
            </p>
          </div>

          {testStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium ${
                testStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testStatus.message}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleTestBeacon}
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Transmitting...' : 'Dispatch Test Signal from External Domain'}</span>
            </button>
          </div>
        </div>

        {/* Connected Domains Table */}
        <div className="bg-dark-800/80 rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Connected Websites ({domains.length})</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Websites currently streaming telemetry into this instance.
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-48">
            {domains.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No active external domains detected yet.
              </div>
            ) : (
              domains.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.domain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-200">{d.totalEvents} signals</div>
                    <div className="text-[10px] text-brand-400">{d.uniqueSessions} sessions</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
