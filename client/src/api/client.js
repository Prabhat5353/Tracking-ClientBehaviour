import axios from 'axios';

// Automatically detect if running on same origin (production/hosted) or Vite dev server
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? (window.location.port === '5173' ? 'http://localhost:5000/api' : `${window.location.origin}/api`)
    : '/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Fetch distinct connected domains & sites tracked
   */
  async getDomains() {
    const res = await apiClient.get('/analytics/domains');
    return res.data;
  },

  /**
   * Fetch high-level KPI overview & timeline chart data (supports site filter)
   */
  async getOverview(siteId = 'ALL') {
    const params = {};
    if (siteId && siteId !== 'ALL') params.siteId = siteId;
    const res = await apiClient.get('/analytics/overview', { params });
    return res.data;
  },

  /**
   * Fetch product interactions ranking & engagement matrix (supports site filter)
   */
  async getProductInteractions(siteId = 'ALL') {
    const params = {};
    if (siteId && siteId !== 'ALL') params.siteId = siteId;
    const res = await apiClient.get('/analytics/product-interactions', { params });
    return res.data;
  },

  /**
   * Fetch conversion funnel stages & drop-off metrics (supports site filter)
   */
  async getFunnel(siteId = 'ALL') {
    const params = {};
    if (siteId && siteId !== 'ALL') params.siteId = siteId;
    const res = await apiClient.get('/analytics/funnel', { params });
    return res.data;
  },

  /**
   * Fetch all unique sessions with aggregate metrics (supports site filter)
   */
  async getSessions(siteId = 'ALL') {
    const params = {};
    if (siteId && siteId !== 'ALL') params.siteId = siteId;
    const res = await apiClient.get('/sessions', { params });
    return res.data.sessions || [];
  },

  /**
   * Fetch chronological journey for a single session
   */
  async getSessionJourney(sessionId) {
    const res = await apiClient.get(`/sessions/${encodeURIComponent(sessionId)}`);
    return res.data;
  },

  /**
   * Fetch deep-dive interaction audit report with action badges & page breakdown
   */
  async getSessionReport(sessionId) {
    const res = await apiClient.get(`/sessions/${encodeURIComponent(sessionId)}/report`);
    return res.data;
  },

  /**
   * Fetch distinct tracked pages list (supports site filter)
   */
  async getPages(siteId = 'ALL') {
    const params = {};
    if (siteId && siteId !== 'ALL') params.siteId = siteId;
    const res = await apiClient.get('/pages', { params });
    return res.data;
  },

  /**
   * Fetch click coordinates for a given URL (or all URLs)
   */
  async getClicks(pageUrl = '', siteId = 'ALL') {
    const params = {};
    if (pageUrl && pageUrl !== 'ALL') {
      params.url = pageUrl;
    }
    if (siteId && siteId !== 'ALL') {
      params.siteId = siteId;
    }
    const res = await apiClient.get('/clicks', { params });
    return res.data;
  },

  /**
   * Seed / simulate realistic enterprise shopping sessions
   */
  async seed() {
    const res = await apiClient.post('/seed');
    return res.data;
  },

  /**
   * Ingest a custom event
   */
  async trackEvent(payload) {
    const res = await apiClient.post('/events', payload);
    return res.data;
  },
};

export default apiClient;
