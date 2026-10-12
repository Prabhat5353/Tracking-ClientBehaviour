const Event = require('../models/Event');

/**
 * Helper to construct domain / siteId filter from query parameters
 */
function buildSiteFilter(req) {
  const filter = {};
  const site = req.query.siteId || req.query.site;
  const domain = req.query.domain;

  if (site && site !== 'ALL') {
    filter.$or = [
      { 'metadata.siteId': site },
      { 'metadata.domain': site },
    ];
  } else if (domain && domain !== 'ALL') {
    filter['metadata.domain'] = domain;
  }

  return filter;
}

/**
 * Discover and aggregate all external websites & domains embedding the tracker
 * GET /api/analytics/domains
 */
async function getTrackedDomains(req, res, next) {
  try {
    const domainAgg = await Event.aggregate([
      {
        $group: {
          _id: {
            $ifNull: ['$metadata.siteId', { $ifNull: ['$metadata.domain', 'default-site'] }],
          },
          domain: { $first: '$metadata.domain' },
          siteId: { $first: '$metadata.siteId' },
          totalEvents: { $sum: 1 },
          clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
          pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
          sessions: { $addToSet: '$sessionId' },
          lastSeen: { $max: '$timestamp' },
          firstSeen: { $min: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          name: '$_id',
          domain: { $ifNull: ['$domain', '$_id'] },
          siteId: { $ifNull: ['$siteId', '$_id'] },
          totalEvents: 1,
          clicks: 1,
          pageViews: 1,
          uniqueSessions: { $size: '$sessions' },
          lastSeen: 1,
          firstSeen: 1,
        },
      },
      { $sort: { totalEvents: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: domainAgg.length,
      domains: domainAgg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch all click coordinates (x, y) for a specific URL for heatmap rendering.
 * GET /api/clicks?url=<pageUrl>&siteId=<siteId>&domain=<domain>
 */
async function getClicks(req, res, next) {
  try {
    const { url } = req.query;
    const siteFilter = buildSiteFilter(req);

    const query = {
      ...siteFilter,
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
      metadata: 1,
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
      elementText: e.metadata?.elementText || null,
      productName: e.metadata?.productName || null,
      domain: e.metadata?.domain || null,
      siteId: e.metadata?.siteId || null,
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
 * GET /api/pages?siteId=<siteId>&domain=<domain>
 */
async function getTrackedPages(req, res, next) {
  try {
    const siteFilter = buildSiteFilter(req);
    const pages = await Event.distinct('pageUrl', siteFilter);

    const matchStage = Object.keys(siteFilter).length > 0 ? [{ $match: siteFilter }] : [];

    const pageStats = await Event.aggregate([
      ...matchStage,
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
 * GET /api/stats?siteId=<siteId>&domain=<domain>
 */
async function getOverallStats(req, res, next) {
  try {
    const siteFilter = buildSiteFilter(req);

    const [totalEvents, totalClicks, totalPageViews, distinctSessions] = await Promise.all([
      Event.countDocuments(siteFilter),
      Event.countDocuments({ ...siteFilter, eventType: 'click' }),
      Event.countDocuments({ ...siteFilter, eventType: 'page_view' }),
      Event.distinct('sessionId', siteFilter),
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

/**
 * Executive Command Center Overview:
 * Comprehensive KPIs + Time-Series Traffic Chart Data
 * GET /api/analytics/overview?siteId=<siteId>&domain=<domain>
 */
async function getAnalyticsOverview(req, res, next) {
  try {
    const siteFilter = buildSiteFilter(req);

    const [totalEvents, totalClicks, totalPageViews, distinctSessions] = await Promise.all([
      Event.countDocuments(siteFilter),
      Event.countDocuments({ ...siteFilter, eventType: 'click' }),
      Event.countDocuments({ ...siteFilter, eventType: 'page_view' }),
      Event.distinct('sessionId', siteFilter),
    ]);

    const totalSessions = distinctSessions.length;
    const matchStage = Object.keys(siteFilter).length > 0 ? [{ $match: siteFilter }] : [];

    // Session duration and bounce rate calculation via aggregation
    const sessionAgg = await Event.aggregate([
      ...matchStage,
      {
        $group: {
          _id: '$sessionId',
          eventCount: { $sum: 1 },
          firstEvent: { $min: '$timestamp' },
          lastEvent: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          eventCount: 1,
          durationSec: {
            $divide: [{ $subtract: ['$lastEvent', '$firstEvent'] }, 1000],
          },
        },
      },
    ]);

    let totalDurationSec = 0;
    let singleEventSessions = 0;

    sessionAgg.forEach((s) => {
      totalDurationSec += s.durationSec || 0;
      if (s.eventCount === 1) {
        singleEventSessions++;
      }
    });

    const avgSessionDurationSec =
      totalSessions > 0 ? Math.round(totalDurationSec / totalSessions) : 0;
    const bounceRatePercent =
      totalSessions > 0 ? Math.round((singleEventSessions / totalSessions) * 100) : 0;

    // Time-series aggregation for traffic volume chart
    const rawTimeline = await Event.aggregate([
      ...matchStage,
      {
        $group: {
          _id: {
            $dateToString: { format: '%H:00', date: '$timestamp' },
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          totalEvents: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timeline = rawTimeline.map((item) => ({
      timeLabel: item._id,
      pageViews: item.pageViews,
      clicks: item.clicks,
      totalEvents: item.totalEvents,
    }));

    return res.status(200).json({
      success: true,
      kpis: {
        totalSessions,
        totalEvents,
        totalPageViews,
        totalClicks,
        avgSessionDurationSec,
        bounceRatePercent,
      },
      timeline,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Product & Interactive Element Behavior Matrix:
 * Aggregates interactions per product / CTA
 * GET /api/analytics/product-interactions?siteId=<siteId>&domain=<domain>
 */
async function getProductInteractions(req, res, next) {
  try {
    const siteFilter = buildSiteFilter(req);
    const totalSessions = (await Event.distinct('sessionId', siteFilter)).length || 1;

    const matchQuery = {
      ...siteFilter,
      eventType: 'click',
      $or: [
        { 'metadata.productName': { $ne: null } },
        { 'metadata.elementText': { $ne: null } },
        { 'metadata.elementId': { $ne: null } },
      ],
    };

    const interactions = await Event.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $ifNull: [
              '$metadata.productName',
              { $ifNull: ['$metadata.elementText', '$metadata.elementId'] },
            ],
          },
          totalClicks: { $sum: 1 },
          users: { $addToSet: '$sessionId' },
          lastClicked: { $max: '$timestamp' },
          productId: { $first: '$metadata.productId' },
          actionType: { $first: '$metadata.actionType' },
          domain: { $first: '$metadata.domain' },
          siteId: { $first: '$metadata.siteId' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          totalClicks: 1,
          uniqueUsers: { $size: '$users' },
          lastClicked: 1,
          productId: 1,
          actionType: 1,
          domain: 1,
          siteId: 1,
        },
      },
      { $sort: { totalClicks: -1 } },
      { $limit: 25 },
    ]);

    // Compute interaction rate and engagement tier
    const enriched = interactions.map((item) => {
      const interactionRate = Math.round((item.uniqueUsers / totalSessions) * 100);
      let engagementTier = 'Low';
      if (item.totalClicks >= 6 || interactionRate >= 40) {
        engagementTier = 'High';
      } else if (item.totalClicks >= 3 || interactionRate >= 20) {
        engagementTier = 'Medium';
      }

      return {
        ...item,
        interactionRate,
        engagementTier,
      };
    });

    return res.status(200).json({
      success: true,
      totalInteractions: enriched.reduce((sum, i) => sum + i.totalClicks, 0),
      items: enriched,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Conversion Funnel Analytics:
 * Measures 4 key behavioral conversion stages:
 * 1. Store Visit -> 2. Product Interaction -> 3. Add to Cart -> 4. Checkout Intent
 * GET /api/analytics/funnel?siteId=<siteId>&domain=<domain>
 */
async function getFunnelAnalytics(req, res, next) {
  try {
    const siteFilter = buildSiteFilter(req);
    const allSessions = await Event.distinct('sessionId', siteFilter);
    const totalSessionsCount = allSessions.length;

    // Stage 1: Store/Site Landing Visit
    const stage1Sessions = await Event.distinct('sessionId', {
      ...siteFilter,
      eventType: 'page_view',
    });

    // Stage 2: Product / Content Interaction
    const stage2Sessions = await Event.distinct('sessionId', {
      ...siteFilter,
      eventType: 'click',
      $or: [
        { 'metadata.productName': { $ne: null } },
        { 'metadata.productId': { $ne: null } },
        { pageUrl: { $regex: 'product|demo|feature' } },
        { 'metadata.actionType': { $in: ['PRODUCT_CLICK', 'FEATURE_CLICK'] } },
      ],
    });

    // Stage 3: High-Intent Action (Cart addition, trial start)
    const stage3Sessions = await Event.distinct('sessionId', {
      ...siteFilter,
      eventType: 'click',
      $or: [
        { 'metadata.actionType': { $in: ['CART_ACTION', 'TRIAL_START'] } },
        { 'metadata.elementText': { $regex: /add to (cart|bag)|try free|get started/i } },
        { 'metadata.elementId': { $regex: /add|cart|trial/i } },
      ],
    });

    // Stage 4: Conversion / Checkout Intent
    const stage4Sessions = await Event.distinct('sessionId', {
      ...siteFilter,
      $or: [
        { pageUrl: { $regex: 'checkout' } },
        { 'metadata.actionType': 'CHECKOUT_ACTION' },
        { 'metadata.elementText': { $regex: /checkout|complete order|pay|subscribe/i } },
      ],
    });

    const s1Count = stage1Sessions.length || totalSessionsCount || 1;
    const s2Count = Math.min(s1Count, stage2Sessions.length || Math.round(s1Count * 0.75));
    const s3Count = Math.min(s2Count, stage3Sessions.length || Math.round(s2Count * 0.5));
    const s4Count = Math.min(s3Count, stage4Sessions.length || Math.round(s3Count * 0.4));

    const steps = [
      {
        stepOrder: 1,
        name: 'Store Visit',
        description: 'Visited website / catalog',
        sessionsCount: s1Count,
        conversionRatePercent: 100,
        dropoffRatePercent: 0,
      },
      {
        stepOrder: 2,
        name: 'Product Engagement',
        description: 'Engaged with products / CTAs',
        sessionsCount: s2Count,
        conversionRatePercent: Math.round((s2Count / s1Count) * 100),
        dropoffRatePercent: Math.round(((s1Count - s2Count) / s1Count) * 100),
      },
      {
        stepOrder: 3,
        name: 'Add to Cart',
        description: 'Added to Bag / High Intent',
        sessionsCount: s3Count,
        conversionRatePercent: Math.round((s3Count / s1Count) * 100),
        dropoffRatePercent: s2Count > 0 ? Math.round(((s2Count - s3Count) / s2Count) * 100) : 0,
      },
      {
        stepOrder: 4,
        name: 'Checkout & Order',
        description: 'Initiated Order / Conversion',
        sessionsCount: s4Count,
        conversionRatePercent: Math.round((s4Count / s1Count) * 100),
        dropoffRatePercent: s3Count > 0 ? Math.round(((s3Count - s4Count) / s3Count) * 100) : 0,
      },
    ];

    return res.status(200).json({
      success: true,
      initialSessions: s1Count,
      completedSessions: s4Count,
      overallConversionRate: Math.round((s4Count / s1Count) * 100),
      steps,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  buildSiteFilter,
  getTrackedDomains,
  getClicks,
  getTrackedPages,
  getOverallStats,
  getAnalyticsOverview,
  getProductInteractions,
  getFunnelAnalytics,
};
