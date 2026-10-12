const express = require('express');
const router = express.Router();

const validateEvent = require('../middleware/validateEvent');
const { trackEvent } = require('../controllers/eventController');
const { getAllSessions, getSessionJourney } = require('../controllers/sessionController');
const { getClicks, getTrackedPages, getOverallStats } = require('../controllers/analyticsController');

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

// Sessions
router.get('/sessions', getAllSessions);
router.get('/sessions/:sessionId', getSessionJourney);

// Heatmap & Analytics
router.get('/clicks', getClicks);
router.get('/pages', getTrackedPages);
router.get('/stats', getOverallStats);

module.exports = router;
