const express = require('express');
const router = express.Router();

const validateEvent = require('../middleware/validateEvent');
const { trackEvent } = require('../controllers/eventController');
const {
  getAllSessions,
  getSessionJourney,
  getSessionReport,
} = require('../controllers/sessionController');
const {
  getClicks,
  getTrackedPages,
  getOverallStats,
  getAnalyticsOverview,
  getProductInteractions,
  getFunnelAnalytics,
  getTrackedDomains,
} = require('../controllers/analyticsController');

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-analytics-api',
  });
});

// Event ingestion
router.post('/events', validateEvent, trackEvent);

// Sessions & User Audit
router.get('/sessions', getAllSessions);
router.get('/sessions/:sessionId', getSessionJourney);
router.get('/sessions/:sessionId/report', getSessionReport);

// Heatmap & Analytics
router.get('/clicks', getClicks);
router.get('/pages', getTrackedPages);
router.get('/stats', getOverallStats);

// Enterprise Analytics Endpoints
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/product-interactions', getProductInteractions);
router.get('/analytics/funnel', getFunnelAnalytics);
router.get('/analytics/domains', getTrackedDomains);

// Optional Seeding Trigger for Live Demonstration
const seedData = require('../utils/seedData');
router.post('/seed', async (req, res, next) => {
  try {
    const count = await seedData();
    res.status(200).json({
      success: true,
      message: `Seeded ${count} events across realistic enterprise shopping sessions.`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

