/**
 * Validates incoming event payload for POST /api/events
 */
function validateEvent(req, res, next) {
  // Support both camelCase and snake_case payload conventions
  const sessionId = req.body.sessionId || req.body.session_id;
  const eventType = req.body.eventType || req.body.event_type;
  const pageUrl = req.body.pageUrl || req.body.page_url;
  const timestamp = req.body.timestamp;
  
  // Coordinates can arrive as { coordinates: { x, y } } or direct { x, y } / { click_x, click_y }
  let coordinates = req.body.coordinates;
  if (!coordinates && (typeof req.body.x === 'number' || typeof req.body.click_x === 'number')) {
    coordinates = {
      x: req.body.x !== undefined ? req.body.x : req.body.click_x,
      y: req.body.y !== undefined ? req.body.y : req.body.click_y,
    };
  }

  // Check required string fields
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "sessionId" / "session_id". Must be a non-empty string.',
    });
  }

  if (!eventType || typeof eventType !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "eventType" / "event_type". Must be "page_view" or "click".',
    });
  }

  const validTypes = ['page_view', 'click'];
  if (!validTypes.includes(eventType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid "eventType": "${eventType}". Allowed values are: ${validTypes.join(', ')}.`,
    });
  }

  if (!pageUrl || typeof pageUrl !== 'string' || !pageUrl.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "pageUrl" / "page_url". Must be a non-empty string.',
    });
  }

  // Validate coordinates if eventType is 'click'
  if (eventType === 'click') {
    if (
      !coordinates ||
      typeof coordinates !== 'object' ||
      typeof coordinates.x !== 'number' ||
      isNaN(coordinates.x) ||
      typeof coordinates.y !== 'number' ||
      isNaN(coordinates.y)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Event of type "click" requires valid numeric coordinates object with { x, y } properties.',
      });
    }
  }

  // Store normalized keys on req.body
  req.body.sessionId = sessionId.trim();
  req.body.eventType = eventType.trim();
  req.body.pageUrl = pageUrl.trim();
  req.body.coordinates = eventType === 'click' ? coordinates : null;

  // Normalize rich semantic metadata
  const rawMeta = req.body.metadata || {};
  const metadata = {
    elementTag: rawMeta.elementTag || req.body.elementTag || req.body.element_tag || null,
    elementId: rawMeta.elementId || req.body.elementId || req.body.element_id || null,
    elementClass: rawMeta.elementClass || req.body.elementClass || req.body.element_class || null,
    elementText: (rawMeta.elementText || req.body.elementText || req.body.element_text || '').substring(0, 150) || null,
    productId: rawMeta.productId || req.body.productId || req.body.product_id || null,
    productName: rawMeta.productName || req.body.productName || req.body.product_name || null,
    actionType: rawMeta.actionType || req.body.actionType || req.body.action_type || (eventType === 'page_view' ? 'VIEW' : 'CLICK_CTA'),
    domain: rawMeta.domain || req.body.domain || req.body.host || req.headers?.host || null,
    siteId: rawMeta.siteId || req.body.siteId || req.body.site_id || rawMeta.domain || req.body.domain || null,
    referrer: (rawMeta.referrer || req.body.referrer || req.headers?.referer || '').substring(0, 300) || null,
    title: (rawMeta.title || req.body.title || '').substring(0, 150) || null,
  };
  req.body.metadata = metadata;

  // Normalize optional user identity fields (from logged-in tracker)
  req.body.userId = req.body.userId || req.body.user_id || null;
  req.body.userEmail = req.body.userEmail || req.body.user_email || null;
  req.body.userName = req.body.userName || req.body.user_name || null;

  // Validate timestamp if provided
  if (timestamp) {
    const parsedDate = new Date(timestamp);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid "timestamp" format. Must be an ISO-8601 string or numeric timestamp.',
      });
    }
    req.body.timestamp = parsedDate;
  }

  // Normalize coordinates for page_view
  if (eventType === 'page_view' && !coordinates) {
    req.body.coordinates = null;
  }

  next();
}

module.exports = validateEvent;
