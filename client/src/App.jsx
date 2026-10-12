import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Screen 1: Executive Overview
import ExecutiveKpiCards from './components/Overview/ExecutiveKpiCards';
import TrafficTimelineChart from './components/Overview/TrafficTimelineChart';
import BehaviorFunnelChart from './components/Overview/BehaviorFunnelChart';
import TopElementsDonut from './components/Overview/TopElementsDonut';

// Screen 2: User Interaction Explorer
import UserInteractionTable from './components/Users/UserInteractionTable';
import UserAuditDrawer from './components/Users/UserAuditDrawer';

// Screen 3: Product Behavior Matrix
import ProductMatrixTable from './components/Products/ProductMatrixTable';

// Screen 4: Visual Heatmap
import HeatmapViewer from './components/HeatmapViewer';

import { api } from './api/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'products' | 'heatmap'

  // Analytics datasets
  const [overviewData, setOverviewData] = useState({ kpis: {}, timeline: [] });
  const [funnelData, setFunnelData] = useState({ steps: [], overallConversionRate: 0 });
  const [productData, setProductData] = useState({ items: [], totalInteractions: 0 });
  const [sessions, setSessions] = useState([]);
  const [pages, setPages] = useState([]);

  // Session audit drawer state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionReportData, setSessionReportData] = useState(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // App loading & control states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Fetch all analytics datasets
  const fetchAllData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      const [overviewRes, funnelRes, productRes, sessionsRes, pagesRes] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getFunnel().catch(() => null),
        api.getProductInteractions().catch(() => null),
        api.getSessions().catch(() => []),
        api.getPages().catch(() => ({ pages: [] })),
      ]);

      if (overviewRes && overviewRes.success) setOverviewData(overviewRes);
      if (funnelRes && funnelRes.success) setFunnelData(funnelRes);
      if (productRes && productRes.success) setProductData(productRes);
      if (sessionsRes) setSessions(sessionsRes);
      if (pagesRes && pagesRes.pages) setPages(pagesRes.pages);

      setServerError(null);
    } catch (err) {
      console.error('Error fetching analytics telemetry:', err);
      setServerError('Unable to reach Analytics API server (http://localhost:5000). Ensure the backend is running.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial mount load
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // Auto-refresh interval (5s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllData]);

  // Open User Audit Drawer
  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setIsAuditLoading(true);
    try {
      const report = await api.getSessionReport(sessionId);
      setSessionReportData(report);
    } catch (err) {
      console.error('Failed to fetch session audit report:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedSessionId(null);
    setSessionReportData(null);
  };

  // Seed / simulate realistic enterprise data
  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      await api.seed();
      await fetchAllData(false);
    } catch (err) {
      console.error('Seeding simulation failed:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex overflow-x-hidden">
      {/* Fixed Executive Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Topbar with Live Telemetry Status */}
        <Topbar
          activeTab={activeTab}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          onRefresh={() => fetchAllData(false)}
          isRefreshing={isRefreshing}
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Server Error Banner */}
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{serverError}</span>
              </div>
              <button
                onClick={() => fetchAllData(false)}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-semibold transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* SCREEN 1: Executive Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 6 Executive KPI Cards */}
              <ExecutiveKpiCards
                kpis={overviewData.kpis}
                funnelData={funnelData}
              />

              {/* Traffic Timeline & Conversion Funnel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrafficTimelineChart data={overviewData.timeline} />
                <BehaviorFunnelChart funnel={funnelData} />
              </div>

              {/* Top Interactive Elements Donut & Ranking */}
              <TopElementsDonut items={productData.items} />
            </div>
          )}

          {/* SCREEN 2: User Interaction Explorer */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <UserInteractionTable
                sessions={sessions}
                onSelectSession={handleSelectSession}
                selectedSessionId={selectedSessionId}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* SCREEN 3: Product Behavior Matrix */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <ProductMatrixTable
                data={productData}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* SCREEN 4: Visual Heatmap & Click Density */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <HeatmapViewer
                pages={pages}
                onRefresh={() => fetchAllData(false)}
                isRefreshing={isRefreshing}
              />
            </div>
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-white/5 py-4 px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto bg-dark-900/30">
          <p>CausalFunnel Enterprise Analytics Command Centre • Multi-User Telemetry Engine</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Latency: &lt;15ms</span>
            <span>•</span>
            <span>REST Endpoints Active</span>
          </div>
        </footer>
      </div>

      {/* Slide-over Deep-Dive User Audit Drawer */}
      {selectedSessionId && (
        <UserAuditDrawer
          reportData={sessionReportData}
          onClose={handleCloseDrawer}
          isLoading={isAuditLoading}
        />
      )}
    </div>
  );
}
