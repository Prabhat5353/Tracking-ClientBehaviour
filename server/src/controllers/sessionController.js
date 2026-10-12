const Event = require('../models/Event');

/**
 * Return a list of all unique sessions with aggregate metrics
 * (totalEvents, lastActive, firstSeen, initialPage, duration) sorted by most recent activity.
 * GET /api/sessions
 */
async function getAllSessions(req, res, next) {
  try {
    const site = req.query.siteId || req.query.site;
    const domain = req.query.domain;
    let matchStage = [];

    if (site && site !== 'ALL') {
      matchStage = [
        {
          $match: {
            $or: [{ 'metadata.siteId': site }, { 'metadata.domain': site }],
          },
        },
      ];
    } else if (domain && domain !== 'ALL') {
      matchStage = [{ $match: { 'metadata.domain': domain } }];
    }

    const sessions = await Event.aggregate([
      ...matchStage,
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          firstSeen: { $min: '$timestamp' },
          lastActive: { $max: '$timestamp' },
          initialPage: { $first: '$pageUrl' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          pagesVisited: { $addToSet: '$pageUrl' },
          domain: { $first: '$metadata.domain' },
          siteId: { $first: '$metadata.siteId' },
        },
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          totalEvents: 1,
          firstSeen: 1,
          lastActive: 1,
          initialPage: 1,
          pageViews: 1,
          clicks: 1,
          domain: 1,
          siteId: 1,
          uniquePagesCount: { $size: '$pagesVisited' },
          pagesVisited: 1,
          durationMs: { $subtract: ['$lastActive', '$firstSeen'] },
          durationSeconds: {
            $round: [{ $divide: [{ $subtract: ['$lastActive', '$firstSeen'] }, 1000] }, 0],
          },
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

/**
 * Deep-Dive Interaction Audit Report for a single session:
 * Computes time spent per page, chronologically indexed activity log with semantic badges
 * GET /api/sessions/:sessionId/report
 */
async function getSessionReport(req, res, next) {
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

    const firstSeen = new Date(events[0].timestamp).getTime();
    const lastActive = new Date(events[events.length - 1].timestamp).getTime();
    const durationMs = lastActive - firstSeen;

    const pagesVisitedSet = new Set();
    let totalClicks = 0;
    let totalPageViews = 0;

    // Build timeline with action badges and time deltas
    const timeline = events.map((event, idx) => {
      pagesVisitedSet.add(event.pageUrl);
      const isPageView = event.eventType === 'page_view';
      if (isPageView) totalPageViews++;
      else totalClicks++;

      const eventTime = new Date(event.timestamp).getTime();
      const prevTime = idx > 0 ? new Date(events[idx - 1].timestamp).getTime() : eventTime;
      const deltaPrevMs = eventTime - prevTime;
      const timeFromStartMs = eventTime - firstSeen;

      // Determine action badge and label
      let actionBadge = isPageView ? 'VIEW' : 'CLICK_CTA';
      let actionLabel = isPageView ? `Page View: ${event.pageUrl}` : 'Click Interaction';

      const meta = event.metadata || {};
      if (meta.actionType === 'CART_ACTION' || (meta.elementText && /add to (cart|bag)/i.test(meta.elementText))) {
        actionBadge = 'CART_ACTION';
        actionLabel = meta.productName ? `Added to Bag: ${meta.productName}` : 'Added Item to Cart';
      } else if (meta.actionType === 'CHECKOUT_ACTION' || /checkout|complete order|pay/i.test(meta.elementText || '')) {
        actionBadge = 'CHECKOUT_ACTION';
        actionLabel = 'Checkout Conversion Action';
      } else if (meta.productName) {
        actionBadge = 'PRODUCT_CLICK';
        actionLabel = `Interacted with ${meta.productName}`;
      } else if (idx > 0 && events[idx - 1].pageUrl !== event.pageUrl && isPageView) {
        actionBadge = 'NAVIGATE';
        actionLabel = `Navigated to ${event.pageUrl}`;
      }

      return {
        stepNumber: idx + 1,
        id: event._id,
        eventType: event.eventType,
        actionBadge,
        actionLabel,
        pageUrl: event.pageUrl,
        timestamp: event.timestamp,
        timeFromStartMs,
        deltaPrevMs,
        coordinates: event.coordinates || null,
        metadata: {
          elementTag: meta.elementTag || null,
          elementId: meta.elementId || null,
          elementText: meta.elementText || null,
          productName: meta.productName || null,
          productId: meta.productId || null,
        },
      };
    });

    // Compute approximate time spent per page
    const pageTimeMap = {};
    for (let i = 0; i < events.length; i++) {
      const p = events[i].pageUrl;
      if (!pageTimeMap[p]) {
        pageTimeMap[p] = { pageUrl: p, eventsCount: 0, timeSpentSec: 0 };
      }
      pageTimeMap[p].eventsCount++;

      // Time spent is elapsed time until next event (or capped at 30s for the last event)
      if (i < events.length - 1) {
        const nextTime = new Date(events[i + 1].timestamp).getTime();
        const curTime = new Date(events[i].timestamp).getTime();
        const diffSec = Math.min(Math.round((nextTime - curTime) / 1000), 120);
        pageTimeMap[p].timeSpentSec += diffSec;
      } else {
        pageTimeMap[p].timeSpentSec += 5; // Final interaction buffer
      }
    }

    const pagesTimeBreakdown = Object.values(pageTimeMap);

    return res.status(200).json({
      success: true,
      sessionId,
      summary: {
        totalEvents: events.length,
        totalClicks,
        totalPageViews,
        firstSeen: new Date(firstSeen).toISOString(),
        lastActive: new Date(lastActive).toISOString(),
        durationMs,
        durationSeconds: Math.round(durationMs / 1000),
        pagesVisitedCount: pagesVisitedSet.size,
        pagesVisited: Array.from(pagesVisitedSet),
      },
      pagesTimeBreakdown,
      timeline,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSessions,
  getSessionJourney,
  getSessionReport,
};
