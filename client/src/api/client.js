import axios from 'axios';

// Automatically detect if running on same origin or Vite dev server
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '5000'
    ? '/api'
    : 'http://localhost:5000/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Fetch high-level KPI overview & timeline chart data
   */
  async getOverview() {
    const res = await apiClient.get('/analytics/overview');
    return res.data;
  },

  /**
   * Fetch product interactions ranking & engagement matrix
   */
  async getProductInteractions() {
    const res = await apiClient.get('/analytics/product-interactions');
    return res.data;
  },

  /**
   * Fetch conversion funnel stages & drop-off metrics
   */
  async getFunnel() {
    const res = await apiClient.get('/analytics/funnel');
    return res.data;
  },

  /**
   * Fetch all unique sessions with aggregate metrics
   */
  async getSessions() {
    const res = await apiClient.get('/sessions');
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
   * Fetch distinct tracked pages list
   */
  async getPages() {
    const res = await apiClient.get('/pages');
    return res.data;
  },

  /**
   * Fetch click coordinates for a given URL (or all URLs)
   */
  async getClicks(pageUrl = '') {
    const params = {};
    if (pageUrl && pageUrl !== 'ALL') {
      params.url = pageUrl;
    }
    const res = await apiClient.get('/clicks', { params });
    return res.data;
  },

  /**
   * Legacy simple stats helper
   */
  async getStats() {
    const res = await apiClient.get('/stats');
    return res.data.stats;
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
