const Event = require('../models/Event');

/**
 * Ingest and validate incoming event payload
 * POST /api/events
 */
async function trackEvent(req, res, next) {
  try {
    const { sessionId, eventType, pageUrl, timestamp, coordinates, metadata } = req.body;

    const event = new Event({
      sessionId,
      eventType,
      pageUrl,
      timestamp: timestamp || new Date(),
      coordinates: eventType === 'click' ? coordinates : null,
      metadata: metadata || null,
    });

    const savedEvent = await event.save();

    return res.status(201).json({
      success: true,
      message: 'Event recorded successfully',
      event: savedEvent,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  trackEvent,
};
