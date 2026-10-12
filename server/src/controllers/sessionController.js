const Event = require('../models/Event');

/**
 * Return a list of all unique sessions with aggregate metrics
 * (totalEvents, lastActive, firstSeen) sorted by most recent activity.
 * GET /api/sessions
 */
async function getAllSessions(req, res, next) {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          firstSeen: { $min: '$timestamp' },
          lastActive: { $max: '$timestamp' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          pagesVisited: { $addToSet: '$pageUrl' },
        },
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          totalEvents: 1,
          firstSeen: 1,
          lastActive: 1,
          pageViews: 1,
          clicks: 1,
          uniquePagesCount: { $size: '$pagesVisited' },
        },
      },
      {
        $sort: { lastActive: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch all chronological events for a specific session to reconstruct the user journey.
 * GET /api/sessions/:sessionId
 */
async function getSessionJourney(req, res, next) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId parameter is required',
      });
    }

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No events found for session: ${sessionId}`,
      });
    }

    const firstSeen = events[0].timestamp;
    const lastActive = events[events.length - 1].timestamp;
    const durationMs = new Date(lastActive).getTime() - new Date(firstSeen).getTime();

    return res.status(200).json({
      success: true,
      sessionId,
      summary: {
        totalEvents: events.length,
        firstSeen,
        lastActive,
        durationMs,
        durationSeconds: Math.round(durationMs / 1000),
      },
      events,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSessions,
  getSessionJourney,
};
