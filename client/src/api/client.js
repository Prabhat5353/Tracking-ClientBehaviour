import axios from 'axios';

// Defaults to Vite proxy '/api' or explicit server endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Fetch high-level KPI overview
   */
  async getStats() {
    const res = await apiClient.get('/stats');
    return res.data.stats;
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
   * Ingest a custom event
   */
  async trackEvent(payload) {
    const res = await apiClient.post('/events', payload);
    return res.data;
  },
};

export default apiClient;
