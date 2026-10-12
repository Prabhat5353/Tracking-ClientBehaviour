import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import SessionTable from './components/SessionTable';
import SessionDrawer from './components/SessionDrawer';
import HeatmapViewer from './components/HeatmapViewer';
import { api } from './api/client';
import { AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'heatmap'
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSessions: 0,
    totalClicks: 0,
    totalPageViews: 0,
    avgEventsPerSession: 0,
  });
  const [sessions, setSessions] = useState([]);
  const [pages, setPages] = useState([]);

  // Selected session drawer state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionJourneyData, setSessionJourneyData] = useState(null);
  const [isJourneyLoading, setIsJourneyLoading] = useState(false);

  // General loading & refreshing state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Fetch core analytics data
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      const [statsRes, sessionsRes, pagesRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getSessions().catch(() => []),
        api.getPages().catch(() => ({ pages: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      if (sessionsRes) setSessions(sessionsRes);
      if (pagesRes && pagesRes.pages) setPages(pagesRes.pages);
      setServerError(null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setServerError('Unable to reach Analytics API server (http://localhost:5000). Ensure the backend is running.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto-refresh interval (5s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Handle selecting a session to view its journey
  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setIsJourneyLoading(true);
    try {
      const data = await api.getSessionJourney(sessionId);
      setSessionJourneyData(data);
    } catch (err) {
      console.error('Failed to load session journey:', err);
    } finally {
      setIsJourneyLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedSessionId(null);
    setSessionJourneyData(null);
  };

  // Seed sample data helper
  const handleSeedData = async () => {
    try {
      setIsRefreshing(true);
      // Ingest a few sample clicks and pageviews if empty
      const testId = `sess_demo_${Date.now().toString(36)}`;
      await api.trackEvent({
        sessionId: testId,
        eventType: 'page_view',
        pageUrl: '/demo/index.html',
      });
      await api.trackEvent({
        sessionId: testId,
        eventType: 'click',
        pageUrl: '/demo/index.html',
        coordinates: { x: 480, y: 310 },
      });
      await api.trackEvent({
        sessionId: testId,
        eventType: 'click',
        pageUrl: '/demo/index.html',
        coordinates: { x: 640, y: 310 },
      });
      await fetchData(false);
    } catch (err) {
      console.error('Seed helper error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRefresh={() => fetchData(false)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{serverError}</span>
            </div>
            <button
              onClick={() => fetchData(false)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-semibold transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Global KPI Cards */}
        <StatsOverview stats={stats} />

        {/* View 1: Sessions Explorer */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <SessionTable
              sessions={sessions}
              onSelectSession={handleSelectSession}
              selectedSessionId={selectedSessionId}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* View 2: Heatmap Visualizer */}
        {activeTab === 'heatmap' && (
          <div className="space-y-4">
            <HeatmapViewer
              pages={pages}
              onRefresh={() => fetchData(false)}
              isRefreshing={isRefreshing}
            />
          </div>
        )}
      </main>

      {/* User Journey Slide-over Drawer */}
      {selectedSessionId && (
        <SessionDrawer
          sessionData={sessionJourneyData}
          onClose={handleCloseDrawer}
          isLoading={isJourneyLoading}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500">
        <p>User Analytics &amp; Session Tracking Application • Built with React, Vite, Tailwind CSS, Node.js &amp; MongoDB</p>
      </footer>
    </div>
  );
}
