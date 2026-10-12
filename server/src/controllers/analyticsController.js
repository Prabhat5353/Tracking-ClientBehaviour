const Event = require('../models/Event');

/**
 * Fetch all click coordinates (x, y) for a specific URL for heatmap rendering.
 * GET /api/clicks?url=<pageUrl>
 */
async function getClicks(req, res, next) {
  try {
    const { url } = req.query;

    const query = {
      eventType: 'click',
      coordinates: { $ne: null },
    };

    if (url) {
      query.pageUrl = url;
    }

    const clickEvents = await Event.find(query, {
      coordinates: 1,
      pageUrl: 1,
      timestamp: 1,
      sessionId: 1,
      _id: 1,
    })
      .sort({ timestamp: -1 })
      .lean();

    // Map to normalized click points format
    const points = clickEvents.map((e) => ({
      id: e._id,
      x: e.coordinates.x,
      y: e.coordinates.y,
      pageUrl: e.pageUrl,
      timestamp: e.timestamp,
      sessionId: e.sessionId,
    }));

    return res.status(200).json({
      success: true,
      pageUrl: url || 'ALL_PAGES',
      totalClicks: points.length,
      points,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch a distinct list of all tracked pageUrl paths for heatmap filtering.
 * GET /api/pages
 */
async function getTrackedPages(req, res, next) {
  try {
    const pages = await Event.distinct('pageUrl');

    // Also get click count and pageview count per page
    const pageStats = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          totalEvents: { $sum: 1 },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          lastSeen: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          pageUrl: '$_id',
          totalEvents: 1,
          clicks: 1,
          pageViews: 1,
          lastSeen: 1,
        },
      },
      {
        $sort: { totalEvents: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: pages.length,
      pages,
      pageStats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch high-level analytics summary KPI cards
 * GET /api/stats
 */
async function getOverallStats(req, res, next) {
  try {
    const [totalEvents, totalClicks, totalPageViews, distinctSessions] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ eventType: 'click' }),
      Event.countDocuments({ eventType: 'page_view' }),
      Event.distinct('sessionId'),
    ]);

    const totalSessions = distinctSessions.length;
    const avgEventsPerSession = totalSessions > 0 ? (totalEvents / totalSessions).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        totalSessions,
        totalClicks,
        totalPageViews,
        avgEventsPerSession: parseFloat(avgEventsPerSession),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClicks,
  getTrackedPages,
  getOverallStats,
};
